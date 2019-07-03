# == Schema Information
#
# Table name: groups
#
#  id                           :bigint(8)        not null, primary key
#  archive_batch                :string
#  archived                     :boolean          default(FALSE)
#  archived_at                  :datetime
#  autojoin_emails              :jsonb
#  handle                       :string
#  name                         :string
#  type                         :string
#  created_at                   :datetime         not null
#  updated_at                   :datetime         not null
#  current_shared_collection_id :integer
#  filestack_file_id            :integer
#  network_id                   :string
#  organization_id              :bigint(8)
#
# Indexes
#
#  index_groups_on_autojoin_emails  (autojoin_emails) USING gin
#  index_groups_on_handle           (handle)
#  index_groups_on_network_id       (network_id)
#  index_groups_on_organization_id  (organization_id)
#  index_groups_on_type             (type)
#

class Group
  class Global < Group
    def common_resource?
      id == Shape::COMMON_RESOURCE_GROUP_ID
    end

    def primary?
      false
    end

    def guest?
      false
    end

    def admin?
      false
    end

    def org_group?
      false
    end

    def requires_org?
      false
    end
  end
end
