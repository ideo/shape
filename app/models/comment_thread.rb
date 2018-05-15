class CommentThread < ApplicationRecord
  belongs_to :record,
             polymorphic: true
  has_many :comments
end
