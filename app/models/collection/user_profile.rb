class Collection
  class UserProfile < Collection
    # the combo [user + org] should be unique, only one user profile per org
    validates :created_by, uniqueness: { scope: :organization }, if: :active?
    validates :name, presence: true
    # allows us to refer to the "created_by" as just the "user"
    alias_attribute :user, :created_by

    def self.find_or_create_for(user:, organization:)
      profile = find_or_initialize_by(created_by: user, organization: organization)
      return profile if profile.persisted?

      # set collection name to user's name
      profile.name = user.name
      # save to persist the record
      profile.save

      profile_collection = organization.profile_collection
      profile_collection.primary_collection_cards.create(
        collection: profile,
        order: profile_collection.collection_cards.count,
      )
      # sort alphabetically by name
      profile_collection.reorder_cards_by_collection_name!

      user.add_role(Role::CONTENT_EDITOR, profile.becomes(Collection))
      # add org primary group as viewer... admins also as content editor
      organization.primary_group.add_role(Role::VIEWER, profile.becomes(Collection))
      organization.admin_group.add_role(Role::CONTENT_EDITOR, profile.becomes(Collection))
      # create the templated cards from the Profile Template
      organization.profile_template.setup_templated_collection(
        for_user: user,
        collection: profile,
      )
      # create the special profile tag for the profile collection
      organization.profile_template.tag(
        profile,
        :with => 'profile',
        :on => :tags
      )
      profile.collection_cards.where.not(item_id: nil).includes(:item).each do |card|
        next unless card.item.is_a? Item::ImageItem
        item = card.item
        item.update(
          filestack_file: FilestackFile.create(
            handle: 'none',
            mimetype: 'image/jpg',
            size: 15_945,
            filename: 'profile.jpg',
            url: user.pic_url_square,
          ),
        )
        break
      end

      # create the card in My Collection
      uc = user.current_user_collection(organization.id)
      uc.link_collection_cards.create(
        collection: profile,
        # put it after SharedWithMe
        order: 1,
      )
      # in case they had been shared other cards already, push those after
      uc.reorder_cards!

      profile.cache_cover!
      profile
    end
  end
end
