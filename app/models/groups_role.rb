class GroupsRole < ApplicationRecord
  belongs_to :group
  belongs_to :role

  amoeba do
    enable
    exclude_association :group
    exclude_association :role
  end

  def self.identifier(role_name:, group_id:)
    "#{role_name}_Group_#{group_id}"
  end
end
