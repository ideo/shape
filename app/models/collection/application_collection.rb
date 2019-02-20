class Collection
  class ApplicationCollection < Collection
    def self.find_or_create_for_bot_user(user, organization)
      existing = user.current_user_collection(organization.id)
      return existing if existing.present?

      # Create the bot user's workspace collection for this org
      collection = create(
        organization: organization,
        name: user.application&.name,
      )
      user.add_role(Role::EDITOR, collection)
      collection
    end

    def system_required?
      true
    end
  end
end
