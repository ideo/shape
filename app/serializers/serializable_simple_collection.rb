# Simple serializer used by:
# - Firestoreable
# - SearchController
# - TestCollection#test_survey_render_class_mappings
class SerializableSimpleCollection < BaseJsonSerializer
  type 'collections'

  attributes(
    :created_at,
    :updated_at,
    :name,
    :organization_id,
    :master_template,
    :archived,
    :collection_type,
  )

  has_one :parent_collection_card
  has_many :collection_cards

  attribute :cover do
    @object.cached_cover || {}
  end

  attribute :is_profile_template do
    @object.profile_template?
  end

  attribute :is_submission_box_template do
    @object.submission_box_template?
  end

  attribute :is_restorable do
    @object.try(:restorable?)
  end

  attribute :serializer do
    'SerializableSimpleCollection'
  end

  # TODO: reuse UserSpecificFields here? the logic is only slightly different...
  attribute :breadcrumb, if: -> { @current_user && @force_breadcrumbs } do
    Breadcrumb::ForUser.new(
      @object,
      @current_user,
    ).viewable_to_api
  end

  attribute :in_my_collection, if: -> { @current_user && @force_breadcrumbs } do
    @current_user.in_my_collection?(@object)
  end

  attribute :can_view, if: -> { @current_ability } do
    # intentionally not using ability so `anyone_can_view?` does not return true
    @current_user ? @object.can_view?(@current_user) : false
  end

  attribute :can_edit, if: -> { @current_ability } do
    @current_ability.can?(:edit, @object)
  end
end
