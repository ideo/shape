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
#

class Item
  class DataItem < Item
    belongs_to :legend_item, class_name: 'Item::LegendItem', optional: true

    has_many :data_items_datasets,
             -> { ordered },
             inverse_of: :data_item,
             dependent: :destroy,
             foreign_key: 'data_item_id'

    has_one :primary_data_items_datasets,
            -> { where(order: 0) },
            foreign_key: 'data_item_id',
            class_name: 'DataItemsDataset'

    has_many :datasets, through: :data_items_datasets

    has_one :primary_dataset,
            through: :primary_data_items_datasets,
            class_name: 'Dataset',
            source: :dataset

    # TODO: deprecate this relationship after migrating
    # all existing DataItems to have datasets
    belongs_to :data_source, polymorphic: true, optional: true
    store_accessor :data_settings,
                   :d_measure,
                   :d_filters, # This is an optional data source (Collection or Item)
                   :d_timeframe
    # END deprecating methods

    validates :report_type, presence: true
    after_create :create_legend_item, if: :create_legend_item?

    accepts_nested_attributes_for :data_items_datasets

    enum report_type: {
      report_type_collections_and_items: 0,
      report_type_network_app_metric: 1,
      report_type_record: 2,
      report_type_question_item: 3,
    }

    amoeba do
      enable
      recognize :has_many
      include_association :data_items_datasets
    end

    attr_accessor :dont_create_legend_item

    def create_legend_item(parent_collection = nil)
      parent_collection ||= parent
      builder = CollectionCardBuilder.new(
        params: {
          order: parent_collection_card.order + 1,
          width: 1,
          height: 2,
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

    def title
      datasets.first&.title
    end

    def description
      datasets.first&.description
    end

    def create_dataset(params)
      # Slice out params used for DataItemsDataset
      order = params.delete(:order)
      # Check if nil first so that selected can be set to false
      selected = params[:selected].nil? ? true : params.delete(:selected)

      dataset_params = {
        type: dataset_type,
        organization_id: organization_id,
      }.merge(params)

      data_items_datasets.create(
        order: order,
        selected: selected,
        dataset: Dataset.new(dataset_params),
      ).dataset
    end

    def csv_data
      return [] unless report_type_record? || report_type_collections_and_items?

      DataReport::DatasetsCSVReport.call(
        # filter only the selected datasets
        datasets: data_items_datasets.selected.map(&:dataset),
      )
    end

    def csv_filename
      dataset = datasets.first
      measure = dataset.measure || 'report'
      timeframe = dataset.timeframe
      source = dataset.data_source.present? ? dataset.data_source.name : 'organization'
      timestamp = Time.current.strftime('%b-%d-%Y')
      "#{organization.name}-#{measure}-#{timeframe}-#{source}-#{timestamp}.csv"
    end

    def selected_datasets
      data_items_datasets.selected.map do |data_items_datasets|
        dataset = data_items_datasets.dataset
        next if dataset.blank?

        dataset.cached_data_items_datasets = data_items_datasets
        dataset
      end.compact
    end

    private

    def dataset_type
      case report_type.to_s
      when 'report_type_collections_and_items'
        'Dataset::CollectionsAndItems'
      when 'report_type_question_item'
        'Dataset::Question'
      when 'report_type_network_app_metric'
        'Dataset::NetworkAppMetric'
      end
    end

    def create_legend_item?
      return false if dont_create_legend_item ||
                      report_type_network_app_metric? ||
                      report_type_collections_and_items?

      legend_item.blank? && parent_collection_card.present?
    end
  end
end
