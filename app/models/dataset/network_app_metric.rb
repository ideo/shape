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
#  max_domain       :integer
#  measure          :string
#  name             :string
#  question_type    :string
#  style            :jsonb
#  timeframe        :integer
#  total            :integer
#  type             :string
#  url              :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  data_source_id   :bigint(8)
#  organization_id  :bigint(8)
#
# Indexes
#
#  index_datasets_on_data_source_type_and_data_source_id  (data_source_type,data_source_id)
#  index_datasets_on_organization_id                      (organization_id)
#

class Dataset
  class NetworkAppMetric < Dataset
    def data
      DataReport::NetworkAppMetric.call(self)
    end
  end
end
