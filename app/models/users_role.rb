# == Schema Information
#
# Table name: users_roles
#
#  id      :integer          not null, primary key
#  role_id :bigint(8)
#  user_id :bigint(8)
#
# Indexes
#
#  index_users_roles_on_role_id  (role_id)
#  index_users_roles_on_user_id  (user_id)
#

class UsersRole < ApplicationRecord
  belongs_to :user
  belongs_to :role, touch: true

  amoeba do
    enable
    recognize []
  end
end
