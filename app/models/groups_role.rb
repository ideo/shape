# == Schema Information
#
# Table name: groups_roles
#
#  id       :bigint(8)        not null, primary key
#  group_id :bigint(8)
#  role_id  :bigint(8)
#
# Indexes
#
#  index_groups_roles_on_group_id              (group_id)
#  index_groups_roles_on_group_id_and_role_id  (group_id,role_id) UNIQUE
#  index_groups_roles_on_role_id               (role_id)
#

class GroupsRole < ApplicationRecord
  belongs_to :group
  belongs_to :role, touch: true

  amoeba do
    enable
    recognize []
  end
end
