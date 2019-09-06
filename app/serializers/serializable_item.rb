class SerializableItem < BaseJsonSerializer
  include SerializedExternalId
  type 'items'
  attributes :name, :content, :data_content,
             :url, :thumbnail_url, :icon_url, :question_type,
             :data_source_type, :data_source_id, :data_settings,
             :previous_thumbnail_urls, :legend_item_id,
             :question_title, :question_description, :archived

  has_many :roles do
    data do
      @object.anchored_roles(viewing_organization_id: @current_user.current_organization_id)
    end
  end

  has_one :parent_collection_card
  has_one :parent
  belongs_to :data_source

  attribute :tag_list do
    @object.cached_tag_list || []
  end

  attribute :chart_data do
    @object.chart_data || {}
  end

  attribute :inherited_tag_list do
    # Only being used for collections right now, here for consistency
    []
  end

  attribute :is_private do
    @object.private?
  end

  attribute :filestack_file_url do
    @object.filestack_file_signed_url
  end

  attribute :filestack_handle do
    @object.filestack_file_handle
  end

  attribute :has_replaced_media do
    @object.replaced_media?
  end

  belongs_to :filestack_file

  attribute :breadcrumb, if: -> { @object == @current_record || @force_breadcrumbs } do
    Breadcrumb::ForUser.new(
      @object,
      @current_user,
    ).viewable_to_api
  end

  attribute :can_view do
    @current_user ? @object.can_view?(@current_user) : false
  end

  attribute :can_edit do
    @current_ability.can?(:edit, @object)
  end

  attribute :can_edit_content do
    @object.active? && @current_ability.can?(:edit_content, @object)
  end

  attribute :pinned_and_locked do
    # might be nil, particularly in tests
    @object.pinned_and_locked? || false
  end

  attribute :pending_transcoding do
    @object.pending_transcoding_uuid.present?
  end

  attribute :common_viewable do
    # only `true` if you're viewing the common resource outside of its home org
    @object.common_viewable? && @object.organization_id != @current_user.current_organization_id
  end

  attribute :is_restorable do
    @object.restorable?
  end

  has_one :restorable_parent do
    @object.try(:restorable_parent)
  end

  attribute :default_group_id do
    @object.default_group_id.to_s
  end
end
