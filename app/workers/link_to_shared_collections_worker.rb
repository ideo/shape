class LinkToSharedCollectionsWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(user_ids, group_ids, object_id, object_class)
    users_to_add = User.where(id: user_ids)
    groups_to_add = Group.where(id: group_ids)
    # this will raise ActiveRecord::RecordNotFound if not found
    object = object_class.safe_constantize.find(object_id)
    users_to_add.each do |user|
      # Don't create any links if object was created by user
      next if object.try(:created_by_id) == user.id
      shared = user.current_shared_collection
      mine = user.current_user_collection
      # Check for already created links to not create doubles
      [shared, mine].each do |collection|
        unless collection.link_collection_cards.with_record(object).exists?
          create_link(object, collection)
        end
      end
    end

    groups_to_add.each do |group|
      shared = group.current_shared_collection
      unless shared.link_collection_cards.with_record(object).exists?
        create_link(object, shared)
      end
    end
  end

  private

  def create_link(object, collection)
    CollectionCard::Link.create(
      parent: collection,
      item_id: (object.is_a?(Item) ? object.id : nil),
      collection_id: (object.is_a?(Collection) ? object.id : nil),
      width: 1,
      height: 1,
      order: collection.collection_cards.count,
    )
  end
end
