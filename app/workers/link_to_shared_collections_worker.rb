class LinkToSharedCollectionsWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(user_ids, group_ids, collection_ids, item_ids)
    users_to_add = User.where(id: user_ids)
    groups_to_add = Group.where(id: group_ids)
    objects = Collection.where(id: collection_ids) + Item.where(id: item_ids)
    (users_to_add + groups_to_add).each do |entity|
      objects.each do |object|
        # Don't create any links if object was created by user
        next if object.try(:created_by_id) == entity.id
        org_id = object.organization_id
        if entity.is_a?(User)
          shared = entity.current_shared_collection(org_id)
          mine = entity.current_user_collection(org_id)
          collections = [shared, mine]
        else
          # for groups, they already only belong to one org
          shared = entity.current_shared_collection
          collections = [shared]
        end
        # Check for already created links to not create doubles
        collections.compact.each do |collection|
          unless collection.link_collection_cards.with_record(object).exists?
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
