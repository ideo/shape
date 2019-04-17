class SerializableSimpleCollection < BaseJsonSerializer
  type 'collections'

  attributes :created_at, :updated_at, :name, :organization_id,
             :master_template
  attribute :cover do
    @object.cached_cover || {}
  end

  attribute :breadcrumb, if: -> { @force_breadcrumbs } do
    Breadcrumb::ForUser.new(
      @object,
      @current_user,
    ).viewable_to_api
  end

  attribute :is_profile_template do
    @object.profile_template?
  end

  attribute :is_submission_box_template do
    @object.submission_box_template?
  end

  has_one :parent_collection_card
  has_many :collection_cards
end
