# == Schema Information
#
# Table name: audience_organizations
#
#  id              :bigint(8)        not null, primary key
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  audience_id     :bigint(8)
#  organization_id :bigint(8)
#
# Indexes
#
#  index_audience_organizations_on_audience_id      (audience_id)
#  index_audience_organizations_on_organization_id  (organization_id)
#

class AudienceOrganization < ApplicationRecord
  belongs_to :audience
  belongs_to :organization
end
