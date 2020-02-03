class OrganizationShellWorker
  include Sidekiq::Worker

  def perform
    OrganizationShellBuilder.new.save
  end
end
