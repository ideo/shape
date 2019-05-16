class CreateOrgWideDatasets
  include Sidekiq::Worker

  def perform(organization_id)
    organization = Organization.find(organization_id)
    Dataset::OrgWideQuestion.find_or_create_for_organization(organization)
  end
end
