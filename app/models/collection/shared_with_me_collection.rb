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
#  end_date                       :datetime
#  font_color                     :string
#  hide_submissions               :boolean          default(FALSE)
#  icon                           :string
#  master_template                :boolean          default(FALSE)
#  name                           :string
#  num_columns                    :integer
#  processing_status              :integer
#  propagate_background_image     :boolean          default(FALSE)
#  propagate_font_color           :boolean          default(FALSE)
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
  class SharedWithMeCollection < Collection
    has_many :collection_cards,
             -> { active.order(updated_at: :desc) },
             class_name: 'CollectionCard',
             foreign_key: :parent_id,
             inverse_of: :parent

    def self.find_or_create_for_collection(parent_collection, user)
      existing = parent_collection.collections.shared_with_me.first

      if existing.present?
        # make sure user is Viewer e.g. if they were re-added to org
        user.add_role(Role::VIEWER, collection.becomes(Collection))
        return existing
      end

      collection = create(
        organization: parent_collection.organization,
      )

      if collection.persisted?
        user.add_role(Role::VIEWER, collection.becomes(Collection))

        parent_collection.primary_collection_cards.create(
          collection: collection,
          # NOTE: we are hiding SharedWithMe from My Collection for now.
          hidden: true,
        )
      end

      collection
    end

    def self.create_for_group(organization)
      # Collection requires an organization. should be the groups org.
      collection = create(
        organization: organization,
      )
      collection
    end

    def searchable?
      false
    end

    def should_index?
      false
    end

    def display_cover?
      # should always just be the generic "Shared With Me" card tile
      false
    end

    def system_required?
      true
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

    def include_object?(obj)
      return false if obj.archived?
      return true if obj.is_a?(Item)

      obj.is_a?(Collection) && obj.type.blank?
    end
  end
end
