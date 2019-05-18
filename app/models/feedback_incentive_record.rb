class FeedbackIncentiveRecord < ApplicationRecord
  belongs_to :user
  belongs_to :survey_response
  validates :survey_response, uniqueness: true
end
