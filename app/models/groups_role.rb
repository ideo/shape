class GroupsRole < ApplicationRecord
  belongs_to :group
  belongs_to :role

  amoeba do
    enable
    exclude_association :group
    exclude_association :role
  end
end
