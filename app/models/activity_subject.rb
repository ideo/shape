# == Schema Information
#
# Table name: activity_subjects
#
#  id           :bigint(8)        not null, primary key
#  subject_type :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  activity_id  :bigint(8)
#  subject_id   :bigint(8)
#
# Indexes
#
#  index_activity_subjects_on_activity_id                  (activity_id)
#  index_activity_subjects_on_subject_type_and_subject_id  (subject_type,subject_id)
#

class ActivitySubject < ApplicationRecord
  belongs_to :activity
  belongs_to :subject, polymorphic: true
end
