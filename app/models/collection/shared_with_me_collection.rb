class Collection
  class SharedWithMeCollection < Collection
    def self.find_or_create_for_collection(parent_collection)
      existing = parent_collection.collections.shared_with_me.first

      return existing if existing.present?

      collection = create(
        organization: parent_collection.organization
      )

      if collection.persisted?
        parent_collection.collection_cards.create(
          collection: collection
        )
      end

      collection
    end

    def searchable?
      false
    end

    def read_only?
      true
    end

    def name
      'Shared with Me'
    end

    def user
      # TODO: how do we reliably figure out who the user is?
      # This only works because of implicit associations
      parent.editors.first
    end

    # Returns (unpersisted) array of collection cards with
    # collections and items that have been shared directly with user,
    # or through any group they are a member of
    def collection_cards
      i = -1

      collections_and_items_shared_with_me.map do |obj|
        CollectionCard.new(
          id: i,
          parent: self,
          height: 1,
          width: 1,
          order: i += 1,
          item: obj.is_a?(Item) ? obj : nil,
          collection: obj.is_a?(Collection) ? obj : nil
        )
      end
    end

    private

    # TODO: right now this is all items shared with me,
    #       not scoped to org
    def collections_and_items_shared_with_me
      Role.user_resources(
        user: user,
        resource_type: %w[Collection Item]
      ).select do |obj|
        include_object?(obj)
      end.sort_by(&:updated_at)
    end

    def include_object?(obj)
      return true if obj.is_a?(Item)

      obj.is_a?(Collection) && obj.type.blank?
    end
  end
end
