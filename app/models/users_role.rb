class UsersRole < ApplicationRecord
  belongs_to :user
  belongs_to :role

  amoeba do
    enable
    exclude_association :user
    exclude_association :role
  end
end
