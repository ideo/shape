class Collection
  class SharedWithMeCollection < Collection
    def self.create_for_collection(parent_collection)
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

    def name
      'Shared with Me'
    end

    # Returns all collections that have been shared directly with user,
    # or through any group they are a member of
    def collection_cards
      # All co
    end
  end
end
