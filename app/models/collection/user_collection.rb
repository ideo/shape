# == Schema Information
#
# Table name: collections
#
#  id                         :bigint(8)        not null, primary key
#  anyone_can_join            :boolean          default(FALSE)
#  anyone_can_view            :boolean          default(FALSE)
#  archive_batch              :string
#  archived                   :boolean          default(FALSE)
#  archived_at                :datetime
#  breadcrumb                 :jsonb
#  cached_attributes          :jsonb
#  cached_test_scores         :jsonb
#  collection_type            :integer          default("collection")
#  cover_type                 :integer          default("cover_type_default")
#  end_date                   :datetime
#  hide_submissions           :boolean          default(FALSE)
#  master_template            :boolean          default(FALSE)
#  name                       :string
#  num_columns                :integer
#  processing_status          :integer
#  search_term                :string
#  shared_with_organization   :boolean          default(FALSE)
#  start_date                 :datetime
#  submission_box_type        :integer
#  submissions_enabled        :boolean          default(TRUE)
#  test_closed_at             :datetime
#  test_launched_at           :datetime
#  test_show_media            :boolean          default(TRUE)
#  test_status                :integer
#  type                       :string
#  unarchived_at              :datetime
#  created_at                 :datetime         not null
#  updated_at                 :datetime         not null
#  cloned_from_id             :bigint(8)
#  collection_to_test_id      :bigint(8)
#  created_by_id              :integer
#  default_group_id           :integer
#  idea_id                    :integer
#  joinable_group_id          :bigint(8)
#  organization_id            :bigint(8)
#  question_item_id           :integer
#  roles_anchor_collection_id :bigint(8)
#  submission_box_id          :bigint(8)
#  submission_template_id     :integer
#  survey_response_id         :integer
#  template_id                :integer
#  test_collection_id         :bigint(8)
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
  class UserCollection < Collection
    attr_accessor :newly_created

    def self.find_or_create_for_user(user, organization)
      existing = user.current_user_collection(organization.id)
      return existing if existing.present?

      # Create the user's workspace collection for this org
      # if they don't already have one
      collection = create(
        organization: organization,
      )
      # we want to keep track of this for later org setup
      collection.newly_created = true

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

    def should_index?
      false
    end

    def breadcrumbable?
      false
    end

    def display_cover?
      # you never see the cover of a "My Collection"
      false
    end

    def system_required?
      true
    end

    def shared_with_me_collection
      collections.shared_with_me.first
    end
  end
end
