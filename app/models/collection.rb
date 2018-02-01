class Collection < ApplicationRecord
  belongs_to :organization
  belongs_to :cloned_from, class_name: 'Collection', optional: true

  enum type: {
    normal: 1,
    root: 2,
  }

  validates :name, presence: true
end
