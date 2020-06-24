class SerializableItem < BaseJsonSerializer
  include SerializedExternalId
  include UserSpecificFields

  type 'items'
  attributes(
    :name,
    :updated_at,
    :created_at,
    :content,
    :quill_data,
    :version,
    :url,
    :thumbnail_url,
    :icon_url,
    :question_type,
    :data_source_type,
    :data_source_id,
    :data_settings,
    :previous_thumbnail_urls,
    :legend_item_id,
    :question_title,
    :question_description,
    :archived,
    :unresolved_count,
    :last_unresolved_comment_id,
    :subtitle_hidden,
    :cloned_from_id,
  )

  has_many :question_choices do
    data do
      @object.question_choices&.viewable_in_ui
    end
  end

  has_one :parent_collection_card
  has_one :parent
  belongs_to :data_source
  belongs_to :filestack_file
  has_many :comments

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

  attribute :show_language_selector do
    @object.parent&.inside_an_application_collection? || false
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

  attribute :pinned_and_locked do
    # might be nil, particularly in tests
    @object.pinned_and_locked? || false
  end

  attribute :pending_transcoding do
    @object.pending_transcoding_uuid.present?
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
