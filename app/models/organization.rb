class Organization < ApplicationRecord
  validates :name, presence: true

  has_many :organization_users
  has_many :users, through: :organization_users
  has_many :collections
end
