# == Schema Information
#
# Table name: users_roles
#
#  id      :integer          not null, primary key
#  role_id :bigint(8)
#  user_id :bigint(8)
#

class UsersRole < ApplicationRecord
  belongs_to :user
  belongs_to :role, touch: true

  amoeba do
    enable
    recognize []
  end
end
