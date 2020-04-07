class OrganizationMembershipAndLinkingWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(added_user_ids,
              organization_id,
              shared_user_ids,
              group_ids,
              collections_to_link,
              items_to_link)

    OrganizationMembershipWorker.perform_sync(
      added_user_ids,
      organization_id,
    )
    LinkToSharedCollectionsWorker.perform_sync(
      shared_user_ids,
      group_ids,
      collections_to_link,
      items_to_link,
    )
  end
end
