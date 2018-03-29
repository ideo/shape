class Collection
  class SharedWithMeCollection < Collection
    def self.find_or_create_for_collection(parent_collection, user)
      existing = parent_collection.collections.shared_with_me.first

      return existing if existing.present?

      collection = create(
        organization: parent_collection.organization,
      )

      if collection.persisted?
        user.add_role(Role::VIEWER, collection.becomes(Collection))

        parent_collection.collection_cards.create(
          collection: collection,
        )
      end

      collection
    end

    def searchable?
      false
    end

    def should_index?
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
      parent.editors[:users].first
    end

    # Returns (unpersisted) array of collection cards with
    # collections and items that have been shared directly with user,
    # or through any group they are a member of
    def collection_cards
      # HACK: this is obviously an imperfect solution but the problem is that if the frontend
      # has loaded the "real" collectionCard with id=X then there will be a collision.
      i = 999_999

      collections_shared_with_me.map do |obj|
        CollectionCard.new(
          id: i,
          parent: self,
          height: 1,
          width: 1,
          order: i += 1,
          item: nil,
          collection: obj.is_a?(Collection) ? obj : nil,
        )
      end
    end

    private

    # TODO: right now this is all collections shared with me,
    #       not scoped to org
    def collections_shared_with_me
      Role.user_resources(
        user: user,
        resource_type: %w[Collection],
      ).select do |obj|
        include_object?(obj)
      end.uniq.sort_by(&:updated_at).reverse
    end

    def include_object?(obj)
      return false if obj.archived?
      return true if obj.is_a?(Item)

      obj.is_a?(Collection) && obj.type.blank?
    end
  end
end
