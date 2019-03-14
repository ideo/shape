class AppMetric < ApplicationRecord
  validates :metric, :value, presence: true
end
