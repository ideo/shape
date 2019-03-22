class Item
  class DataItem < Item
    belongs_to :legend_item, class_name: 'Item::LegendItem', optional: true

    store_accessor :data_settings,
                   :d_measure,
                   :d_filters,
                   :d_timeframe

    validates :report_type, presence: true
    validate :collections_and_items_validations, if: :report_type_collections_and_items?
    validate :network_app_metric_validations, if: :report_type_network_app_metric?
    validate :record_validations, if: :report_type_record?
    after_create :create_legend_item, if: :create_legend_item?

    delegate :selected_measures, to: :legend_item, allow_nil: true

    VALID_MEASURES = %w[
      participants
      viewers
      activity
      content
      collections
      items
      records
    ].freeze
    VALID_TIMEFRAMES = %w[
      ever
      month
      week
    ].freeze

    enum report_type: {
      report_type_collections_and_items: 0,
      report_type_network_app_metric: 1,
      report_type_record: 2,
    }

    attr_accessor :dont_create_legend_item

    # All datasets available
    def all_datasets
      @all_datasets ||= load_datasets
    end

    # Datasets that may be filtered by legend
    def datasets
      all_datasets.select do |dataset|
        dataset[:order].zero? ||
          (
            selected_measures.present? &&
            selected_measures.include?(dataset[:measure].to_s)
          )
      end
    end

    def create_legend_item(parent_collection = nil)
      parent_collection ||= parent
      builder = CollectionCardBuilder.new(
        params: {
          order: parent_collection_card.order + 1,
          item_attributes: {
            type: 'Item::LegendItem',
          },
        },
        parent_collection: parent_collection,
      )
      if builder.create
        update(legend_item: builder.collection_card.record)
      else
        errors.add(:legend_item, builder.errors.full_messages.join('. '))
        throw :abort
      end
    end

    # Override duplicate! so we can control legend item cloning
    def duplicate!(**args)
      self.dont_create_legend_item = true
      duplicate = super(args)
      return duplicate if duplicate.new_record? || duplicate.errors.present?

      duplicate
    end

    private

    def load_datasets
      if report_type_record?
        return [] if data_content['datasets'].blank?
        data_content['datasets'].map(&:deep_symbolize_keys)
      elsif report_type_network_app_metric?
        DataReport::NetworkAppMetric.new(self).call
      elsif report_type_collections_and_items?
        DataReport::CollectionsAndItems.new(self).call
      end
    end

    def record_validations
      return if data_content.present?
      errors.add(:data_content, 'must be present')
    end

    def network_app_metric_validations
      return if url.present?
      errors.add(:url, 'must be present')
    end

    def collections_and_items_validations
      if !VALID_MEASURES.include?(d_measure.to_s)
        errors.add(:data_settings, "measure must be one of #{VALID_MEASURES.join(', ')}")
      end
      return if VALID_TIMEFRAMES.include?(d_timeframe.to_s)
      errors.add(:data_settings, "timeframe must be one of #{VALID_TIMEFRAMES.join(', ')}")
    end

    def create_legend_item?
      return false if dont_create_legend_item
      report_type_record? && legend_item.blank? && parent_collection_card.present?
    end
  end
end
