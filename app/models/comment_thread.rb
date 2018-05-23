class CommentThread < ApplicationRecord
  include HasActivities
  belongs_to :record,
             polymorphic: true
  has_many :comments, dependent: :destroy
end
