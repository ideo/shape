module TestResultsCollection
  class CreateIdeaCollectionCards
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :parent_collection,
           :idea_item,
           :num_idea,
           :order,
           :media_card,
           :description_card,
           :created_by,
           :message

    require_in_context :parent_collection, :idea_item, :num_idea

    delegate :parent_collection, :idea_item, :media_card,
             :description_card, :num_idea, :order, :created_by,
             to: :context

    before do
      context.media_card = find_existing_media_card
      context.description_card = find_existing_description_card
      context.order = 0 if order.nil?
    end

    def call
      if media_card.present?
        update_media_card
      elsif test_show_media?
        create_media_card
      end

      context.order += 1 if test_show_media?

      if description_card.present?
        update_description_card
      else
        create_description_card
      end

      context.order += 1
    end

    private

    def create_media_card
      TestResultsCollection::CreateItemLink.call!(
        parent_collection: parent_collection,
        item: idea_item,
        width: 2,
        height: 2,
        order: order,
        identifier: "idea-#{num_idea}-media",
      )
    end

    def update_media_card
      if test_show_media?
        media_card.update(order: order) unless media_card.order == order
      else
        media_card.archive!
      end
    end

    def find_existing_media_card
      parent_collection
        .link_collection_cards
        .identifier("idea-#{num_idea}-media")
        .first
    end

    def create_description_card
      create_card(
        params: description_card_attrs,
        parent_collection: parent_collection,
        created_by: created_by,
      )
    end

    def find_existing_description_card
      parent_collection
        .primary_collection_cards
        .item
        .identifier("idea-#{num_idea}-description")
        .includes(:item)
        .first
    end

    def update_description_card
      description_item = description_card.item
      description_item.import_html_content(idea_name_and_description)
      description_item.name = idea_item.name
      description_item.save

      return if description_card.order == order

      description_card.update(order: order)
    end

    def description_card_attrs
      {
        order: order,
        width: 2,
        height: 2,
        identifier: "idea-#{num_idea}-description",
        item_attributes: {
          type: 'Item::TextItem',
          name: idea_item.name,
          content: idea_name_and_description,
        },
      }
    end

    def idea_name_and_description
      # TODO: link the idea name to idea results collection
      html = "<h2>#{idea_item.name}</h2>"
      idea_item.content.split(/\n+/).each do |paragraph|
        html += "<p>#{paragraph}</p>"
      end
      html
    end

    def test_show_media?
      idea_item.parent.parent.test_show_media?
    end
  end
end
