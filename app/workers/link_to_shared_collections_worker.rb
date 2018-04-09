class LinkToSharedCollectionsWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(user_ids, object_id, object_class)
    users_to_add = User.where(id: user_ids).to_a
    object = object_class.safe_constantize.find(object_id)
    users_to_add.each do |user|
      # Don't create any links if object was created by user
      next if object.created_by and object.created_by.id == user.id
      shared = user.current_shared_collection
      mine = user.current_user_collection
      create_link(object, shared) if shared and object
      # Check for already created links to not create doubles
      existing = object.is_a?(Item) ?
        mine.collection_cards.where(item_id: object.id) :
        mine.collection_cards.where(collection_id: object.id)
      create_link(object, mine) if existing.count == 0 and mine and object
    end
  end

  private

  def create_link(object, collection)
    link = CollectionCard::Link.new
    link.parent = collection
    link.item_id = object.id if object.is_a?(Item)
    link.collection_id = object.id if object.is_a?(Collection)
    link.width = 1
    link.height = 1
    link.order = collection.collection_cards.count
    link.save
  end
end
