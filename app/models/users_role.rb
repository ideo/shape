class UsersRole < ApplicationRecord
  belongs_to :user
  belongs_to :role

  amoeba do
    enable
    exclude_association :user
    exclude_association :role
  end

  def self.identifier(role_name:, user_id:)
    "#{role_name}_User_#{user_id}"
  end
end
