class LinkToSharedCollectionsWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(user_ids, group_ids, objects_info)
    users_to_add = User.where(id: user_ids)
    groups_to_add = Group.where(id: group_ids)
    # TODO: anyway to do this with where rather then map?
    objects = objects_info.map { |o| o["type"].safe_constantize.find(o["id"]) }
    (users_to_add + groups_to_add).each do |entity|
      objects.each do |object|
        # Don't create any links if object was created by user
        next if object.try(:created_by_id) == entity.id
        shared = user.current_shared_collection
        mine = user.current_user_collection
        # Check for already created links to not create doubles
        # Groups won't have my collections so skip creating lnks
        [shared, mine].each do |collection|
          unless collection and
                 collection.link_collection_cards.with_record(object).exists?
            create_link(object, collection)
          end
        end
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
