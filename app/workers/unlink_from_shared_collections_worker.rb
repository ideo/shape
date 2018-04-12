class UnlinkFromSharedCollectionsWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(user_ids, group_ids, object_id, object_class)
    users = User.where(id: user_ids)
    groups = Group.where(id: group_ids)
    object = object_class.safe_constantize.find(object_id)

    (users + groups).each do |entity|
      shared = entity.current_shared_collection
      shared_link = shared.link_collection_cards.with_record(object).first
      if shared_link.present? && !object.can_view?(entity)
        shared_link.destroy
      end
    end
  end
end
