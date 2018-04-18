class UnlinkFromSharedCollectionsWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(user_ids, group_ids, collection_ids, item_ids)
    users = User.where(id: user_ids)
    groups = Group.where(id: group_ids)
    objects = Collection.where(id: collection_ids) + Item.where(id: item_ids)
    (users + groups).each do |entity|
      objects.each do |object|
        shared = entity.current_shared_collection
        shared_link = shared.link_collection_cards.with_record(object).first
        if shared_link.present? && !object.can_view?(entity)
          shared_link.destroy
        end
      end
    end
  end
end
