# == Schema Information
#
# Table name: audience_demographic_criteria
#
#  id           :bigint(8)        not null, primary key
#  criteria_key :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  audience_id  :bigint(8)
#
# Indexes
#
#  index_audience_demographic_criteria_on_audience_id  (audience_id)
#

class AudienceDemographicCriteria < ApplicationRecord
  belongs_to :audience

  validates :criteria_key, presence: true
end
