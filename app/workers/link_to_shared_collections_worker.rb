class LinkToSharedCollectionsWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(user_ids, object)
    users_to_add = User.where(id: user_ids).to_a
    # TODO why can't we just pass in the object if we're not using the class?
    # object = object_class.safe_constantize.find(object_id)
    users_to_add.each do |user|
      shared = user.current_shared_collection
      mine = user.current_user_collection
      create_link(object, shared)
      create_link(object, mine)
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
    # Is it better to batch save somehow?
    link.save
  end
end
