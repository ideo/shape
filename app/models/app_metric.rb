# == Schema Information
#
# Table name: app_metrics
#
#  id         :bigint(8)        not null, primary key
#  metric     :string
#  value      :float
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
# Indexes
#
#  index_app_metrics_on_metric_and_created_at  (metric,created_at)
#

class AppMetric < ApplicationRecord
  validates :metric, :value, presence: true
end
