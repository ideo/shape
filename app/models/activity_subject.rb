class ActivitySubject < ApplicationRecord
  belongs_to :activity
  belongs_to :subject, polymorphic: true
end
