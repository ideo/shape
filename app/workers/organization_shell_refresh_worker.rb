class OrganizationShellRefreshWorker
  include Sidekiq::Worker

  def perform
    old_organization_ids = Organization.where(shell: true).pluck(:id)
    10.times do
      OrganizationShellBuilder.new.save
    end
    return unless old_organization_ids.present?

    Organization.where(id: old_organization_ids).destroy_all
  end
end
