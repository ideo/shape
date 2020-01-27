class OrganizationShellWorker
  include Sidekiq::Worker

  def perform
    builder = OrganizationShellBuilder.new
    builder.save
  end
end
