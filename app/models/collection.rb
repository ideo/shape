class Collection < ApplicationRecord
  belongs_to :organization
  belongs_to :cloned_from, class_name: 'Collection', optional: true

  validates :name, presence: true
end
