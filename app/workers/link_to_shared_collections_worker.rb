class LinkToSharedCollectionsWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(user_ids, group_ids, object_ids, object_classes)
    # TODO: don't like how object ids and classes separated like this
    users_to_add = User.where(id: user_ids)
    groups_to_add = Group.where(id: group_ids)
    # TODO: anyway to do this with where rather then map?
    objects = object_ids.map { |o| o.record_type.find(o.id) }
    users_to_add.each do |user|
      objects.each do |object|
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
    end

    # TODO: try and reuse above
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
