# == Schema Information
#
# Table name: network_invitations
#
#  id              :bigint(8)        not null, primary key
#  token           :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  organization_id :bigint(8)
#  user_id         :bigint(8)
#
# Indexes
#
#  index_network_invitations_on_token                        (token)
#  index_network_invitations_on_user_id_and_organization_id  (user_id,organization_id)
#

class NetworkInvitation < ApplicationRecord
  belongs_to :user
  belongs_to :organization
end
