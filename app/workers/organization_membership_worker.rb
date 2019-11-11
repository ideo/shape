class OrganizationMembershipWorker
  include Sidekiq::Worker

  def perform(user_ids, organization_id)
    @users = User.where(id: user_ids)
    @organization = Organization.find_by_id(organization_id)
    return unless @organization.present?

    @users.each do |user|
      @organization.setup_user_membership_and_collections(user)
    end
  end
end
