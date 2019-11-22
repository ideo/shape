module TestResultsCollection
  class CreateCollection
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :test_collection,
           :test_results_collection,
           :idea,
           :created_by

    require_in_context :test_collection

    delegate :test_collection,
             :test_results_collection,
             :idea,
             :created_by,
             to: :context

    delegate :legend_item,
             to: :test_results_collection

    before do
      context.created_by ||= test_collection.created_by
      context.test_results_collection ||= find_test_results_collection
    end

    def call
      ActiveRecord::Base.transaction do
        # this inner block only happens when first launching/creating the test results collection
        # (either master, or per idea)
        if test_results_collection.blank?
          context.test_results_collection = master_results_collection? ? create_master_collection : create_idea_collection
          if master_results_collection?
            update_test_collection_name
            move_test_collection_inside_test_results
            move_roles_to_results_collection if move_roles?
          end
        end

      rescue Interactor::Failure => e
        raise ActiveRecord::Rollback, e.message
      end

      opts = [
        test_results_collection.id,
        created_by&.id,
      ]
      if ENV['CYPRESS'].present?
        TestResultsCollection::CreateContentWorker.new.perform(*opts)
      else
        TestResultsCollection::CreateContentWorker.perform_async(*opts)
      end
    end

    private

    def find_test_results_collection
      return test_collection.test_results_collection if master_results_collection?

      idea.test_results_collection
    end

    def master_results_collection?
      idea.blank?
    end

    def create_master_collection
      collection = Collection::TestResultsCollection.create(
        name: test_collection.name,
        organization: test_collection.organization,
        created_by: created_by,
        roles_anchor_collection: test_results_roles_anchor,
        test_collection: test_collection,
        idea: idea,
        loading_content: true,
      )
      return collection if collection.persisted?

      context.fail!(
        message: collection.errors.full_messages.to_sentence,
      )
    end

    def create_idea_collection
      collection = create_card(
        params: {
          collection_attributes: {
            name: idea.name,
            type: 'Collection::TestResultsCollection',
            test_collection: test_collection,
            idea: idea,
            loading_content: true,
          },
          identifier: CardIdentifier.call(test_collection.test_results_collection, idea),
        },
        parent_collection: test_collection.test_results_collection,
        created_by: created_by,
      ).record
      collection
    end

    def update_test_collection_name
      test_collection.update(
        name: "#{test_collection.name}#{Collection::TestCollection::FEEDBACK_DESIGN_SUFFIX}",
      )
    end

    def move_roles_to_results_collection
      test_collection.roles.each do |role|
        role.update(resource: test_results_collection)
      end
      # reload to re-associate the roles
      reload_collections
      # reanchor the test collection and children to test_results_collection
      test_collection.reanchor!(parent: test_results_collection, propagate: true)
    end

    def move_test_collection_inside_test_results
      test_collection.parent_collection_card.update(
        collection_id: test_results_collection.id,
      )

      # pick up parent_collection_card relationship
      reload_collections

      create_card(
        params: {
          collection_id: test_collection.id,
        },
        parent_collection: test_results_collection,
        created_by: created_by,
      )
    end

    def reload_collections
      test_collection.reload
      test_results_collection.reload
    end

    def test_results_roles_anchor
      # anchor the test results to whatever the test collection was anchored to (could be nil for itself)
      test_collection.roles_anchor_collection
    end

    def move_roles?
      test_results_roles_anchor.blank?
    end
  end
end
