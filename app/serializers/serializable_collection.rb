class SerializableCollection < BaseJsonSerializer
  ROLES_LIMIT = 5

  type 'collections'

  attributes :created_at, :updated_at, :name, :organization_id,
             :master_template, :template_id,
             :submission_box_type, :submission_box_id, :submission_template_id,
             :test_status, :collection_to_test_id

  has_many :roles
  has_one :parent_collection_card
  has_one :parent
  has_one :live_test_collection
  belongs_to :submissions_collection
  belongs_to :submission_template
  belongs_to :collection_to_test

  attribute :system_required do
    @object.system_required?
  end

  attribute :tag_list do
    @object.cached_tag_list || []
  end

  attribute :inherited_tag_list do
    @object.cached_owned_tag_list || []
  end

  attribute :cover do
    @object.cached_cover || {}
  end

  attribute :test_scores do
    @object.cached_test_scores || {}
  end

  attribute :type do
    @object.type || @object.class.name
  end

  attribute :breadcrumb, if: -> { @current_record.nil? || @object == @current_record } do
    Breadcrumb::ForUser.new(
      @object,
      @current_user,
    ).viewable_to_api
  end

  attribute :processing_status do
    @object.processing_status.try(:titleize)
  end

  belongs_to :organization
  belongs_to :created_by

  attribute :collection_card_count do
    @object.cached_card_count || 0
  end

  has_many :collection_cards do
    data do
      @object.collection_cards_viewable_by(
        @object.collection_cards,
        @current_user,
        card_order: @card_order,
      )
    end
  end

  # expose this for the front-end to be aware
  attribute :card_order do
    @card_order || (@object.is_a?(Collection::SubmissionsCollection) ? 'updated_at' : 'order')
  end

  attribute :can_edit do
    @current_ability.can?(:edit, @object)
  end

  attribute :can_edit_content do
    # NOTE: this also ends up coming into play when you are an editor
    # but the collection is "pinned_and_locked"
    @current_ability.can?(:edit_content, @object)
  end

  # NOTE: a lot of these boolean attributes could probably be omitted if not applicable, which would potentially
  # slim down the API request for collections
  attribute :is_org_template_collection do
    @object.org_templates?
  end

  attribute :is_profile_template do
    @object.profile_template?
  end

  attribute :is_profile_collection do
    @object.profiles?
  end

  attribute :pinned_and_locked do
    # might be nil, particularly in tests
    @object.pinned_and_locked? || false
  end

  attribute :is_submission_box_template do
    @object.submission_box_template?
  end

  attribute :is_submission_box_template_test do
    @object.submission_box_template_test?
  end

  attribute :submission_attrs, if: -> { @object.submission? } do
    @object.submission_attrs
  end

  attribute :template_num_instances do
    if @object.master_template?
      @object.templated_collections.active.count
    else
      0
    end
  end

  attribute :launchable, if: -> { @object.test_collection? } do
    @object.launchable?
  end

  attribute :test_collection_id, if: -> { @object.is_a?(Collection::TestDesign) } do
    @object.test_collection.id.to_s
  end
end
