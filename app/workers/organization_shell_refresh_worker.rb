class OrganizationShellRefreshWorker
  include Sidekiq::Worker

  def perform
    old_organizations = Organization.where(shell: true)
    [0.10].each do
      OrganizationShellBuilder.new.save
    end
    older_organizations.destroy_all
  end
end
