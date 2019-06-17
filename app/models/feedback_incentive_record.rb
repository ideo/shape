# == Schema Information
#
# Table name: feedback_incentive_records
#
#  id                 :bigint(8)        not null, primary key
#  amount             :decimal(10, 2)
#  current_balance    :decimal(10, 2)
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  survey_response_id :bigint(8)
#  user_id            :bigint(8)
#
# Indexes
#
#  index_feedback_incentive_records_on_survey_response_id  (survey_response_id)
#  index_feedback_incentive_records_on_user_id             (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (survey_response_id => survey_responses.id)
#  fk_rails_...  (user_id => users.id)
#

class FeedbackIncentiveRecord < ApplicationRecord
  belongs_to :user
  belongs_to :survey_response
  validates :survey_response, uniqueness: true
end
