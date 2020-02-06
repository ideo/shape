class LinkToSharedCollectionsWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(user_ids, group_ids, collection_ids, item_ids)
    @users_to_add = User.where(id: user_ids)
    @groups_to_add = Group.where(id: group_ids)
    @objects = Collection.where(id: collection_ids) + Item.where(id: item_ids)
    create_links
  end

  private

  def create_links
    entities.each do |entity|
      objects_to_add.each do |object|
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

  def entities
    (@users_to_add + @groups_to_add).reject do |entity|
      # bot users don't get anything shared in their ApplicationCollection
      entity.try(:bot_user?)
    end
  end

  # Makes sure we have a unique list of objects
  def objects_to_add
    @objects.map do |object|
      # If linking to any collection in C∆ Dashboard,
      # add top-level card (unless linking method library)
      if within_application_collection?(object) && !method_library_collection?(object)
        object.parent_application_collection.collections.first
      else
        object
      end
    end.uniq
  end

  def org_dashboard_collection?(object)
    return false unless within_application_collection?(object)

    object.name.match?(/creative[\s\_\-]+difference/i)
  end

  def method_library_collection?(object)
    return false unless within_application_collection?(object)

    object.name.match?(/method[\s\_\-]+library/i)
  end

  def within_application_collection?(object)
    object.respond_to?(:parent_application_collection) &&
      object.parent_application_collection.present?
  end

  def create_link(object, collection)
    CollectionCard::Link.create(
      card_attrs(object, collection),
    )
  end

  def card_attrs(object, collection)
    width, height = card_width_height(object)
    order = card_order(object, collection)
    existing_card_attrs = object.parent_collection_card&.link_card_copy_attributes || {}

    existing_card_attrs.merge(
      parent: collection,
      item_id: (object.is_a?(Item) ? object.id : nil),
      collection_id: (object.is_a?(Collection) ? object.id : nil),
      width: width,
      height: height,
      order: order,
    )
  end

  def card_width_height(object)
    width = 1
    height = 1

    if org_dashboard_collection?(object)
      width = 3
      height = 2
    elsif method_library_collection?(object)
      height = 2
    end

    [width, height]
  end

  def card_order(object, collection)
    # If sharing C∆/App collection, always put it at the beginning of your 'My Collection'
    if within_application_collection?(object)
      return -9 if method_library_collection?(object)

      # Use -10 because 'getting started' content is often beforehand
      -10
    else
      collection.collection_cards.count
    end
  end
end
