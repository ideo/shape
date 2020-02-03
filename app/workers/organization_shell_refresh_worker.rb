class OrganizationShellRefreshWorker
  include Sidekiq::Worker

  def perform
    old_organizations = Organization.where(shell: true)
    10.times do
      OrganizationShellBuilder.new.save
    end
    old_organizations.destroy_all
  end
end
