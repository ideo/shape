class OrganizationCloningWorker
  include Sidekiq::Worker

  def perform
    OrganizationBuilder
  end
end
