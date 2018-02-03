class CollectionCard < ApplicationRecord
  belongs_to :collection
  belongs_to :linkable, polymorphic: true

  validates :collection, :linkable, :order, presence: true

  scope :not_reference, -> { where(reference: false) }
  scope :reference, -> { where(reference: true) }
end
