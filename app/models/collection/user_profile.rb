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
      if profile.persisted?
        # since we're calling this from setup_user_membership, we would want to unarchive
        profile.unarchive_and_reset_permissions! if profile.archived?
        return profile
      end

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
      profile_collection.reorder_cards!

      # copy roles down from the profile_collection
      profile.unanchor_and_inherit_roles_from_anchor!
      user.add_role(Role::EDITOR, profile.becomes(Collection))
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

      # replace the first image item with the user's network pic
      profile.replace_placeholder_with_user_pic!
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
    return if user.picture_medium.blank?
    card = collection_cards
           .pinned
           .joins(:item)
           .where('items.type = ?', 'Item::FileItem')
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
        url: user.picture_medium,
      ),
    )
    cache_cover!
  end

  def unarchive_and_reset_permissions!
    unarchive!
    user.add_role(Role::EDITOR, becomes(Collection))
    reset_permissions!
  end
end
