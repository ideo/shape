class Item
  class LegendItem < Item
    has_many :data_items,
             class_name: 'Item::DataItem',
             inverse_of: :legend_item

    has_many :data_items_datasets,
             -> { ordered },
             through: :data_items

    has_many :datasets, through: :data_items_datasets

    # TODO: deprecate after migrating --
    # selected measures moved to the DataItemsDatasets join table
    store_accessor :data_settings,
                   :selected_measures

    before_create :set_default_search_source, unless: :legend_search_source
    after_save :touch_related_collection_cards

    enum legend_search_source: {
      search_test_collections: 0,
      select_from_datasets: 1,
    }

    def name
      'Legend'
    end

    private

    def set_default_search_source
      self.legend_search_source = :search_test_collections
    end

    def touch_related_collection_cards
      CollectionCard::Primary
        .where(
          item_id: data_item_ids,
        ).update_all(updated_at: Time.current)
    end
  end
end
