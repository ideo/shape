class OrganizationShellWorker
  include Sidekiq::Worker

  def perform
    OrganizationShellBuilder.new(true).save
  end
end
