class Collection
  class UserCollection < Collection
    def self.create_for_user(user, organization)
      collection = create(organization: organization)

      return collection if collection.new_record?

      user.add_role(:editor, collection.becomes(Collection))

      Collection::SharedWithMeCollection.create_for_collection(collection)

      collection
    end

    def name
      'My Collection'
    end

    def searchable?
      false
    end
  end
end
