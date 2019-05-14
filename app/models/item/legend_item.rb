class Item
  class LegendItem < Item
    has_many :data_items,
             class_name: 'Item::DataItem',
             inverse_of: :legend_item

    has_many :data_items_datasets, through: :data_items
    has_many :datasets, through: :data_items_datasets

    # TODO: deprecate after migrating --
    # selected measures moved to the DataItemsDatasets join table
    store_accessor :data_settings,
                   :selected_measures

    after_save :touch_related_collection_cards

    def name
      'Legend'
    end

    private

    def touch_related_collection_cards
      CollectionCard::Primary
        .where(
          item_id: data_item_ids,
        ).update_all(updated_at: Time.current)
    end
  end
end
