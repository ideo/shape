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
#  last_broadcast_at          :datetime
#  legend_search_source       :integer
#  name                       :string
#  question_type              :integer
#  report_type                :integer
#  style                      :jsonb
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
#  index_items_on_archive_batch                        (archive_batch)
#  index_items_on_breadcrumb                           (breadcrumb) USING gin
#  index_items_on_cloned_from_id                       (cloned_from_id)
#  index_items_on_created_at                           (created_at)
#  index_items_on_data_source_type_and_data_source_id  (data_source_type,data_source_id)
#  index_items_on_question_type                        (question_type)
#  index_items_on_roles_anchor_collection_id           (roles_anchor_collection_id)
#  index_items_on_transcoding_uuid                     (((cached_attributes ->> 'pending_transcoding_uuid'::text)))
#  index_items_on_type                                 (type)
#

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

    def datasets_viewable_by(user = nil)
      filtered_datasets = user ? datasets.viewable_by_user(user) : datasets
      filtered_datasets.map do |dataset|
        dataset.cached_data_items_datasets = data_items_datasets_by_dataset_id[dataset.id]
        dataset
      end.sort_by(&:order)
    end

    private

    def data_items_datasets_by_dataset_id
      @data_items_datasets_by_dataset_id ||= data_items_datasets.each_with_object({}) do |data_items_dataset, h|
        h[data_items_dataset.dataset_id] = data_items_dataset
      end
    end

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
