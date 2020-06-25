# == Schema Information
#
# Table name: collections
#
#  id                             :bigint(8)        not null, primary key
#  anyone_can_join                :boolean          default(FALSE)
#  anyone_can_view                :boolean          default(FALSE)
#  archive_batch                  :string
#  archived                       :boolean          default(FALSE)
#  archived_at                    :datetime
#  breadcrumb                     :jsonb
#  cached_attributes              :jsonb
#  cached_test_scores             :jsonb
#  collection_type                :integer          default("collection")
#  cover_type                     :integer          default("cover_type_default")
#  custom_icon                    :string
#  end_date                       :datetime
#  hide_submissions               :boolean          default(FALSE)
#  master_template                :boolean          default(FALSE)
#  name                           :string
#  num_columns                    :integer
#  processing_status              :integer
#  search_term                    :string
#  shared_with_organization       :boolean          default(FALSE)
#  show_icon_on_cover             :boolean
#  start_date                     :datetime
#  submission_box_type            :integer
#  submissions_enabled            :boolean          default(TRUE)
#  test_closed_at                 :datetime
#  test_launched_at               :datetime
#  test_show_media                :boolean          default(TRUE)
#  test_status                    :integer
#  type                           :string
#  unarchived_at                  :datetime
#  created_at                     :datetime         not null
#  updated_at                     :datetime         not null
#  challenge_admin_group_id       :integer
#  challenge_participant_group_id :integer
#  challenge_reviewer_group_id    :integer
#  cloned_from_id                 :bigint(8)
#  collection_to_test_id          :bigint(8)
#  created_by_id                  :integer
#  default_group_id               :integer
#  idea_id                        :integer
#  joinable_group_id              :bigint(8)
#  organization_id                :bigint(8)
#  question_item_id               :integer
#  roles_anchor_collection_id     :bigint(8)
#  submission_box_id              :bigint(8)
#  submission_template_id         :integer
#  survey_response_id             :integer
#  template_id                    :integer
#  test_collection_id             :bigint(8)
#
# Indexes
#
#  index_collections_on_archive_batch               (archive_batch)
#  index_collections_on_breadcrumb                  (breadcrumb) USING gin
#  index_collections_on_cached_test_scores          (cached_test_scores) USING gin
#  index_collections_on_cloned_from_id              (cloned_from_id)
#  index_collections_on_created_at                  (created_at)
#  index_collections_on_idea_id                     (idea_id)
#  index_collections_on_organization_id             (organization_id)
#  index_collections_on_roles_anchor_collection_id  (roles_anchor_collection_id)
#  index_collections_on_submission_box_id           (submission_box_id)
#  index_collections_on_submission_template_id      (submission_template_id)
#  index_collections_on_template_id                 (template_id)
#  index_collections_on_test_status                 (test_status)
#  index_collections_on_type                        (type)
#
# Foreign Keys
#
#  fk_rails_...  (organization_id => organizations.id)
#

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
      # now that it's a child of the profiles collection, reanchor
      profile.reanchor!

      # copy roles down from the profile_collection
      profile.unanchor_and_inherit_roles_from_anchor!

      user.add_role(Role::EDITOR, profile.becomes(Collection))
      organization.admin_group.add_role(Role::EDITOR, profile.becomes(Collection))
      # create the templated cards from the Profile Template
      organization.profile_template.setup_templated_collection(
        for_user: user,
        collection: profile,
        synchronous: :first_level,
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
      type: 'Item::ExternalImageItem',
      url: user.picture_medium,
    )
    cache_cover!
  end

  def unarchive_and_reset_permissions!
    unarchive!
    user.add_role(Role::EDITOR, becomes(Collection))
    reset_permissions!
  end
end
