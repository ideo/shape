class SerializableItem < BaseJsonSerializer
  ROLES_LIMIT = 5
  type 'items'
  attributes :type, :name, :content, :text_data,
             :url, :thumbnail_url, :icon_url, :question_type
  has_one :parent_collection_card

  attribute :tag_list do
    @object.cached_tag_list || []
  end

  attribute :inherited_tag_list do
    # Only being used for collections right now, here for consistency
    []
  end

  attribute :filestack_file_url do
    @object.cached_filestack_file_url || ''
  end

  has_one :parent
  belongs_to :filestack_file

  attribute :breadcrumb do
    Breadcrumb::ForUser.new(
      @object,
      @current_user,
    ).viewable_to_api
  end

  attribute :can_edit do
    @current_ability.can?(:edit, @object)
  end

  attribute :can_edit_content do
    @current_ability.can?(:edit_content, @object)
  end

  attribute :pinned_and_locked do
    # might be nil, particularly in tests
    @object.pinned_and_locked? || false
  end

  has_many :roles
end
