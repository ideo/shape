class OrganizationShellRefreshWorker
  include Sidekiq::Worker

  def perform
    Organization.where(shell: true).destroy_all
    [0.10].each do
      OrganizationShellBuilder.new.save
    end
  end
end
