module TestResultsCollection
  class CreateResponseGraph
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :test_results_collection,
           :item,
           :order,
           :legend_item,
           :created_by,
           :message

    require_in_context :item

    delegate :test_results_collection, :item, :legend_item, :created_by,
             to: :context

    delegate :test_audiences, to: :test_results_collection

    delegate :question_dataset, :org_wide_question_dataset,
             to: :item

    before do
      context.legend_item ||= test_results_collection.legend_item
    end

    def call
      if existing_card.present?
        existing_card.update(order: order) unless existing_card.order == order
        return existing_card
      end

      @card = create_card(
        attrs: data_item_card_attrs(item),
        parent_collection: test_results_collection,
        created_by: created_by,
      )

      context.legend_item ||= @card.record.legend_item

      link_datasets

      test_audiences.each do |test_audience|
        item.create_test_audience_dataset(
          test_audience, @card.record
        )
      end
    end

    private

    def existing_card
      test_results_collection
        .primary_collection_cards
        .joins(item: :data_items_datasets)
        .merge(
          DataItemsDataset.where(id: item.question_dataset.id),
        )
    end

    def link_datasets
      question_dataset.data_items_datasets.create(
        data_item: @card.record,
      )
      @card.record.data_items_datasets.create(
        dataset: org_wide_question_dataset,
      )
    end

    def data_item_card_attrs(item)
      {
        order: item.parent_collection_card.order,
        height: 2,
        width: 2,
        item_attributes: {
          type: 'Item::DataItem',
          report_type: :report_type_question_item,
          legend_item_id: legend_item&.id,
        },
      }
    end
  end
end
