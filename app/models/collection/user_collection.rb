class Collection
  class UserCollection < Collection
    def self.find_or_create_for_user(user, organization)
      existing = user.current_user_collection
      return existing if existing.present?

      # Create the user's workspace collection for this org
      # if they don't already have one
      collection = create(organization: organization)

      return collection if collection.new_record?

      user.add_role(Role::EDITOR, collection.becomes(Collection))

      Collection::SharedWithMeCollection.find_or_create_for_collection(collection, user)

      collection
    end

    def name
      'My Collection'
    end

    def searchable?
      false
    end

    def breadcrumbable?
      false
    end

    def shared_with_me_collection
      collections.shared_with_me.first
    end
  end
end
