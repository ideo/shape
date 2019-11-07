module TestResultsCollection
  class CreateResponseGraph
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :parent_collection,
           :item,
           :order,
           :legend_item,
           :created_by,
           :message

    require_in_context :item, :parent_collection

    delegate :parent_collection, :item, :legend_item, :created_by,
             to: :context

    delegate :question_dataset, :org_wide_question_dataset,
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

      @card = create_card(
        params: data_item_card_attrs(item),
        parent_collection: parent_collection,
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

    def find_existing_card
      parent_collection
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

    def test_audiences
      item.parent.test_audiences
    end
  end
end
