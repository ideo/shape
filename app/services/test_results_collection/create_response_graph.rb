module TestResultsCollection
  class CreateResponseGraph
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :parent_collection,
           :data_item,
           :item,
           :order,
           :legend_item,
           :created_by,
           :survey_response,
           :idea,
           :message

    require_in_context :item, :parent_collection

    delegate :parent_collection,
             :item,
             :data_item,
             :legend_item,
             :created_by,
             :order,
             :survey_response,
             :idea,
             to: :context

    delegate :question_dataset,
             :org_wide_question_dataset,
             to: :item

    before do
      context.legend_item ||= parent_collection.legend_item
      context.created_by ||= parent_collection.created_by
    end

    def call
      existing_card = find_existing_card
      if existing_card.present?
        existing_card.update(order: order) unless existing_card.order == order
        return
      end
      create_data_item
      context.legend_item ||= data_item.legend_item

      # Create datasets (in specific order so they appear that way in the legend)
      create_idea_datasets if idea.present?
      create_survey_response_idea_datasets if survey_response.present?
      link_question_and_org_wide_datasets
      create_test_audiences_datasets
    end

    private

    def create_data_item
      card = create_card(
        params: data_item_card_attrs(item),
        parent_collection: parent_collection,
        created_by: created_by,
      )
      context.data_item = card.item
    end

    def find_existing_card
      parent_collection
        .primary_collection_cards
        .identifier("item-#{item.id}-data-item")
        .includes(:item)
        .first
    end

    def create_test_audiences_datasets
      test_audiences.each do |test_audience|
        item.create_test_audience_dataset(
          test_audience: test_audience,
          data_item: data_item,
          idea: idea,
        )
      end
    end

    def create_idea_datasets
      item.create_idea_question_dataset(
        idea: idea,
        data_item: data_item,
      )
    end

    def create_survey_response_idea_datasets
      survey_response.test_collection.idea_items.each do |idea|
        item.create_survey_response_idea_dataset(
          survey_response: survey_response,
          idea: idea,
          data_item: data_item,
        )
      end
    end

    def link_question_and_org_wide_datasets
      question_dataset.data_items_datasets.create(
        data_item: data_item,
      )
      data_item.data_items_datasets.create(
        dataset: org_wide_question_dataset,
      )
    end

    def data_item_card_attrs(item)
      {
        order: order,
        height: 2,
        width: 2,
        identifier: "item-#{item.id}-data-item",
        item_attributes: {
          type: 'Item::DataItem',
          report_type: :report_type_question_item,
          legend_item_id: legend_item&.id,
        },
      }
    end

    def test_audiences
      return [survey_response.test_audience].compact if survey_response.present?

      item.parent.test_audiences
    end
  end
end
