class Collection
  class SharedWithMeCollection < Collection
    has_many :collection_cards,
             -> { order(:desc) },
             class_name: 'CollectionCard',
             foreign_key: :parent_id,
             inverse_of: :parent

    def self.find_or_create_for_collection(parent_collection, user)
      existing = parent_collection.collections.shared_with_me.first

      return existing if existing.present?

      collection = create(
        organization: parent_collection.organization,
      )

      if collection.persisted?
        user.add_role(Role::VIEWER, collection.becomes(Collection))

        parent_collection.primary_collection_cards.create(
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

    def name
      'Shared with Me'
    end

    def user
      # TODO: how do we reliably figure out who the user is?
      # This only works because of implicit associations
      parent.editors[:users].first
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
