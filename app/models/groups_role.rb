class GroupsRole < ApplicationRecord
  belongs_to :group
  belongs_to :role
end
