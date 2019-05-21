# == Schema Information
#
# Table name: items
#
#  id                         :bigint(8)        not null, primary key
#  archive_batch              :string
#  archived                   :boolean          default(FALSE)
#  archived_at                :datetime
#  breadcrumb                 :jsonb
#  cached_attributes          :jsonb
#  content                    :text
#  data_content               :jsonb
#  data_settings              :jsonb
#  data_source_type           :string
#  icon_url                   :string
#  name                       :string
#  question_type              :integer
#  report_type                :integer
#  thumbnail_url              :string
#  type                       :string
#  unarchived_at              :datetime
#  url                        :string
#  created_at                 :datetime         not null
#  updated_at                 :datetime         not null
#  cloned_from_id             :bigint(8)
#  data_source_id             :bigint(8)
#  filestack_file_id          :integer
#  legend_item_id             :integer
#  roles_anchor_collection_id :bigint(8)
#
# Indexes
#
#  index_items_on_breadcrumb                           (breadcrumb) USING gin
#  index_items_on_cloned_from_id                       (cloned_from_id)
#  index_items_on_created_at                           (created_at)
#  index_items_on_data_source_type_and_data_source_id  (data_source_type,data_source_id)
#  index_items_on_roles_anchor_collection_id           (roles_anchor_collection_id)
#  index_items_on_type                                 (type)
#

class Item
  class LegendItem < Item
    has_many :data_items,
             class_name: 'Item::DataItem',
             inverse_of: :legend_item

    store_accessor :data_settings,
                   :selected_measures

    before_save :set_default_selected_measures
    after_save :touch_related_collection_cards

    def name
      'Compare To'
    end

    def primary_measure
      return if primary_datasets.blank?
      sample_dataset = primary_datasets.first
      dataset_measure_hash(sample_dataset)
    end

    # Comparisons are non-primary measures from all linked datasets
    def comparison_measures
      non_primary_datasets
        .each_with_object({}) do |dataset, h|
          next if h[dataset[:measure]].present?
          h[dataset[:measure]] = dataset_measure_hash(dataset)
        end.values
    end

    private

    def dataset_measure_hash(dataset)
      {
        measure: dataset[:measure],
        style: dataset[:style],
        order: dataset[:order],
      }
    end

    def primary_datasets
      datasets_with_data.select { |dataset| dataset[:order].zero? }
    end

    def non_primary_datasets
      datasets_with_data.reject { |dataset| dataset[:order].zero? }
    end

    def datasets_with_data
      @datasets_with_data ||= data_items.map(&:all_datasets).flatten.select do |dataset|
        dataset[:data].present? || dataset[:single_value].present?
      end
    end

    def set_default_selected_measures
      self.selected_measures ||= []
    end

    def touch_related_collection_cards
      CollectionCard::Primary
        .where(
          item_id: data_item_ids,
        ).update_all(updated_at: Time.current)
    end
  end
end
