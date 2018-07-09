class Collection
  class UserProfile < Collection
    # the combo [user + org] should be unique, only one user profile per org
    validates :created_by, uniqueness: { scope: :organization }, if: :active?
    # allows us to refer to the "created_by" as just the "user"
    alias_attribute :user, :created_by

    def self.find_or_create_for(user:, organization:)
      find_or_create_by(created_by: user, organization: organization) do |profile|
        # if we enter the block, then we're creating a new record...
        # set collection name to user's name
        profile.name = user.name
        user.add_role(Role::CONTENT_EDITOR, profile.becomes(Collection))
        # create the templated cards from the Profile Template
        organization.profile_template.create_templated_cards(
          for_user: user,
          parent: profile,
        )

        # create the card in My Collection
        uc = user.current_user_collection(organization.id)
        uc.primary_collection_cards.create(
          collection: profile,
          # put it after SharedWithMe
          order: 1,
        )
        # in case they had been shared other cards already, push those after
        uc.reorder_cards!
      end
    end
  end
end
