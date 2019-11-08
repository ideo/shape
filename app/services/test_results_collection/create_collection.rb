module TestResultsCollection
  class CreateCollection
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :test_collection,
           :test_results_collection,
           :created_by,
           :idea,
           :message

    require_in_context :test_collection

    delegate :test_results_collection, :test_collection, :idea, :created_by,
             to: :context

    delegate :legend_item, to: :test_results_collection

    before do
      context.created_by ||= test_collection.created_by
      context.test_results_collection ||= find_test_results_collection
    end

    def call
      ActiveRecord::Base.transaction do
        if test_results_collection.blank?
          context.test_results_collection = master_results_collection? ? create_master_collection : create_idea_collection
          if master_results_collection?
            update_test_collection_name
            move_roles_to_results_collection if move_roles?
            move_test_collection_inside_test_results
          end
        end

        TestResultsCollection::CreateContent.call!(
          test_results_collection: test_results_collection,
          created_by: created_by,
          idea: idea,
        )

        # might not need this next step?
        test_collection.cache_cover!
        test_results_collection.reorder_cards!
        move_legend_item_to_third_spot if legend_item.present?

      rescue Interactor::Failure => e
        raise ActiveRecord::Rollback, e.message
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
      )

      return collection if collection.persisted?

      context.fail!(
        message: collection.errors.full_messages.to_sentence,
      )
    end

    def create_idea_collection
      create_card(
        params: {
          collection_attributes: {
            name: idea.name,
            type: 'Collection::TestResultsCollection',
            test_collection: test_collection,
            idea: idea,
          },
        },
        parent_collection: test_collection.test_results_collection,
        created_by: created_by,
      ).record
    end

    def update_test_collection_name
      test_collection.update(
        name: "#{test_collection.name} #{Collection::TestCollection::FEEDBACK_DESIGN_SUFFIX}",
      )
    end

    def move_roles_to_results_collection
      test_collection.roles.each do |role|
        role.update(resource: test_results_collection)
      end
    end

    def move_test_collection_inside_test_results
      test_collection.parent_collection_card.update(
        collection_id: test_results_collection.id,
      )

      # pick up parent_collection_card relationship
      reload_collections

      create_card(
        params: {
          order: 999,
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
      return test_collection.roles_anchor if test_collection.roles_anchor != test_collection
    end

    def move_roles?
      test_results_roles_anchor.blank?
    end

    def move_legend_item_to_third_spot
      legend_card = legend_item.parent_collection_card
      return if legend_card.order == 2

      legend_card.move_to_order(2)
    end
  end
end
