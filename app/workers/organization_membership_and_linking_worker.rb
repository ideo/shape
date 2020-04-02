# TODO...
class OrganizationMembershipAndLinkingWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'


  # def perform( some args ... )
  #   OrganizationMembershipWorker.perform_sync(...)
  #   LinkToSharedCollectionsWorker.perform_sync(...)
  # end
end
