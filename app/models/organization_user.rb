class OrganizationUser < ApplicationRecord
  belongs_to :organization
  belongs_to :user

  enum role: {
    member: 1,
    guest: 2,
  }
end
