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
      org_id = objects_to_add.first&.organization_id

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
      collections = collections.compact.uniq

      if objects_to_add.any? { |o| within_creative_difference_application?(o) }
        # make 2 rows of room for C∆ collections
        collections.each do |collection|
          ensure_two_open_rows(collection)
        end
      end

      objects_to_add.each do |object|
        collections.each do |collection|
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
    @objects_to_add ||= @objects.map do |object|
      application_collection = object.try(:parent_application_collection)
      if application_collection.present?
        # If linking to any collection in C∆ Dashboard,
        # link to the top-level C∆ Org collection and Method Library collection
        org_dashboard_and_method_library_collections(application_collection)
      else
        object
      end
    end.flatten.uniq
    @objects_to_add.sort_by do |o|
      # add links to C∆ collections first so that they take the top spots
      within_creative_difference_application?(o) ? 0 : 1
    end
  end

  def org_dashboard_and_method_library_collections(application_collection)
    application_collection
      .collections
      .select do |collection|
        org_dashboard_collection?(collection) ||
          method_library_collection?(collection)
      end
  end

  def ensure_two_open_rows(collection)
    cards = collection.collection_cards.visible
    non_dashboard_cards_taking_up_first_two_rows = false
    cards.where(row: 0).or(cards.where(row: 1)).find_each do |card|
      non_dashboard_cards_taking_up_first_two_rows = !within_creative_difference_application?(card.record)
    end

    return unless non_dashboard_cards_taking_up_first_two_rows

    # insert two rows at the top (push down everything below row: -1)
    CollectionGrid::RowInserter.call(
      row: -1,
      collection: collection,
      movement: 2,
    )
  end

  def within_creative_difference_application?(object)
    object.try(:inside_an_application_collection?)
  end

  def org_dashboard_collection?(collection)
    collection.name.match?(/creative[\s\_\-]+difference/i)
  end

  def method_library_collection?(collection)
    collection.name.match?(/method[\s\_\-]+library/i)
  end

  def create_link(object, collection)
    CollectionCardBuilder.call(
      params: card_attrs(object),
      parent_collection: collection,
      type: 'link',
    )
  end

  def card_attrs(object)
    existing_card_attrs = object.parent_collection_card&.link_card_copy_attributes || {}
    row = nil
    col = nil
    if within_creative_difference_application?(object)
      if org_dashboard_collection?(object)
        row = 0
        col = 0
      elsif method_library_collection?(object)
        row = 0
        col = 3
      end
    end

    existing_card_attrs.merge(
      item_id: (object.is_a?(Item) ? object.id : nil),
      collection_id: (object.is_a?(Collection) ? object.id : nil),
      row: row,
      col: col,
    )
  end

  # def card_order(object, collection)
  #   # If sharing C∆/App collection, always put it at the beginning of your 'My Collection'
  #   if within_creative_difference_application?(object)
  #     return -9 if method_library_collection?(object)
  #     # Use -10 because 'getting started' content is often beforehand
  #     return -10 if org_dashboard_collection?(object)
  #   end
  #
  #   collection.collection_cards.count
  # end
end
