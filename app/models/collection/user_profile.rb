class Collection
  class UserProfile < Collection
    # the combo [user + org] should be unique, only one user profile per org
    validates :created_by, uniqueness: { scope: :organization }, if: :active?
    validates :name, presence: true
    # allows us to refer to the "created_by" as just the "user"
    alias_attribute :user, :created_by

    def system_required?
      true
    end

    def self.find_or_create_for_user(user:, organization:)
      profile = find_or_initialize_by(created_by: user, organization: organization)
      return profile if profile.persisted?

      # set collection name to user's name
      profile.name = user.name
      # save to persist the record
      saved = profile.save
      # if some error happened here
      return false unless saved

      profile_collection = organization.profile_collection
      profile_collection.primary_collection_cards.create(
        collection: profile,
        order: profile_collection.collection_cards.count,
      )
      # sort alphabetically by name
      profile_collection.reorder_cards_by_collection_name!

      user.add_role(Role::EDITOR, profile.becomes(Collection))
      # add org primary group as viewer... admins also as content editor
      organization.primary_group.add_role(Role::VIEWER, profile.becomes(Collection))
      organization.guest_group.add_role(Role::VIEWER, profile.becomes(Collection))
      organization.admin_group.add_role(Role::EDITOR, profile.becomes(Collection))
      # create the templated cards from the Profile Template
      organization.profile_template.setup_templated_collection(
        for_user: user,
        collection: profile,
      )
      # create the special profile tag for the profile collection
      organization.profile_template.tag(
        profile,
        with: 'profile',
        on: :tags,
      )

      # replace the first image item with the user's pic_url_square
      profile.replace_placeholder_with_user_pic!

      # create the card in My Collection
      uc = user.current_user_collection(organization.id)
      # just as a catch...
      if uc.present?
        uc.link_collection_cards.create(
          collection: profile,
          # put it after SharedWithMe
          order: 1,
        )
        # in case they had been shared other cards already, push those after
        uc.reorder_cards!
      end

      profile.reload.update_cached_tag_lists
      profile.cache_cover!
      profile.update_user_cached_profiles!
      profile
    end
  end

  def update_user_cached_profiles!
    user.cached_user_profiles ||= {}
    user.cached_user_profiles[organization_id] = id
    user.save
  end

  def replace_placeholder_with_user_pic!
    return if user.pic_url_square.blank?
    card = collection_cards
           .pinned
           .joins(:item)
           .where('items.type = ?', 'Item::ImageItem')
           .first
    return unless card.present?
    item = card.item
    item.update(
      # TODO: set up a non "FilestackFile" way of creating an image card?
      filestack_file: FilestackFile.create(
        handle: 'none',
        mimetype: 'image/jpg',
        size: 15_945,
        filename: 'profile.jpg',
        url: user.pic_url_square,
      ),
    )
  end
end
