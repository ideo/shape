class UnlinkFromSharedCollectionsWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(user_ids, object_id, object_class)
    users = User.where(id: user_ids)
    object = object_class.safe_constantize.find(object_id)

    users.each do |user|
      shared = user.current_shared_collection
      shared_link = shared.link_collection_cards.with_record(object).first
      if shared_link.present? && !object.can_view?(user)
        shared_link.destroy
      end
    end
  end
end
