class UnlinkFromSharedCollectionsWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(user_ids, object_id, object_class)
    users = User.where(id: user_ids).to_a

    users.each do |user|
      shared = user.current_shared_collection
      mine = user.current_user_collection

      shared_link = shared.collection_cards.where(collection_id: object_id).first
      my_link = mine.collection_cards.where(collection_id: object_id).first

      shared.collection_cards.delete(shared_link)
      mine.collection_cards.delete(my_link)
    end
  end

  private
end
