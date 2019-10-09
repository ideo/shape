# == Schema Information
#
# Table name: datasets
#
#  id               :bigint(8)        not null, primary key
#  cached_data      :jsonb
#  chart_type       :integer
#  data_source_type :string
#  description      :text
#  groupings        :jsonb
#  identifier       :string
#  max_domain       :integer
#  measure          :string
#  name             :string
#  question_type    :string
#  style            :jsonb
#  tiers            :jsonb
#  timeframe        :integer
#  total            :integer
#  type             :string
#  url              :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  application_id   :integer
#  data_source_id   :bigint(8)
#  organization_id  :bigint(8)
#
# Indexes
#
#  index_datasets_on_data_source_type_and_data_source_id  (data_source_type,data_source_id)
#  index_datasets_on_organization_id                      (organization_id)
#

class Dataset
  class Empty < Dataset
    before_validation :set_default_timeframe

    def self.create_for_collection(collection:, chart_type:)
      create(
        cached_data: DataReport::QuestionItem.base_data,
        chart_type: chart_type,
        data_source: collection,
      )
    end

    def total
      0
    end

    def identifier
      return self[:identifier] if self[:identifier].present?
      return if data_source.blank?
      return data_source.name if data_source.is_a?(Collection)

      data_source.parent.name if data_source.is_a?(Item)
    end

    def test_collection_id
      return unless data_source.present?
      return data_source.id if data_source.is_a?(Collection::TestCollection)
    end

    private

    def set_default_timeframe
      self.timeframe = :ever
    end
  end
end
