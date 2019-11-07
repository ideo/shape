module TestResultsCollection
  class CreateIdeaCollection
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :parent_collection,
           :idea_item,
           :order,
           :created_by,
           :idea_collection,
           :message

    require_in_context :idea_item, :parent_collection

    delegate :parent_collection, :idea_collection, :idea_item, :created_by,
             to: :context

    before do
      context.created_by ||= parent_collection.created_by
    end

    def call
      idea_collection_card = find_existing_card
      if idea_collection_card.present?
        context.idea_collection = idea_collection_card.record
        idea_collection_card.update(order: order) unless idea_collection_card.order == order
        find_existing_media_item_link&.archive! unless test_show_media?
      else
        context.idea_collection = create_idea_collection
        link_media_item if test_show_media?
        create_idea_description_card
      end
    end

    private

    def find_existing_card
      parent_collection
        .primary_collection_cards
        .joins(:collection)
        .where(
          collections: { idea_id: idea_item.id },
        )
        .first
    end

    def create_idea_collection
      create_card(
        params: idea_collection_card_attrs,
        parent_collection: parent_collection,
        created_by: created_by,
      ).record
    end

    def link_media_item
      TestResultsCollection::CreateItemLink.call!(
        parent_collection: idea_collection,
        item: idea_item,
        order: 0,
      )
    end

    def find_existing_media_item_link
      idea_collection
        .link_collection_cards
        .where(item_id: idea_item.id)
        .first
    end

    def create_idea_description_card
      create_card(
        params: idea_description_card_attrs,
        parent_collection: idea_collection,
        created_by: created_by,
      )
    end

    def idea_description_card_attrs
      {
        order: test_show_media? ? 1 : 0,
        item_attributes: {
          type: 'Item::TextItem',
          name: idea_item.name,
          content: idea_item.content,
        },
      }
    end

    def idea_collection_card_attrs
      {
        collection_attributes: {
          name: idea_item.name,
        },
      }
    end

    def test_show_media?
      idea_item.parent.test_show_media?
    end
  end
end
