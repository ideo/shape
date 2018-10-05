class SerializableCollection < BaseJsonSerializer
  ROLES_LIMIT = 5

  type 'collections'

  attributes :created_at, :updated_at, :name, :organization_id,
             :master_template, :template_id,
             :submission_box_type, :submission_box_id, :submission_template_id,
             :test_status

  has_one :parent_collection_card
  belongs_to :submissions_collection
  belongs_to :submission_template

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

  attribute :type do
    @object.type || @object.class.name
  end

  attribute :breadcrumb, if: -> { @object == @current_record } do
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

  has_many :collection_cards do
    data do
      @object.collection_cards_viewable_by(
        @object.collection_cards,
        @current_user,
      )
    end
  end

  attribute :can_edit do
    @current_ability.can?(:edit, @object)
  end

  attribute :can_edit_content do
    @current_ability.can?(:edit_content, @object)
  end

  attribute :test_can_reopen do
    @object.is_a?(Collection::TestCollection) && @object.can_reopen?
  end

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

  has_many :roles
end
