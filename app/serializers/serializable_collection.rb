class SerializableCollection < BaseJsonSerializer
  include SerializedExternalId
  type 'collections'
  attributes(
    :name,
    :created_at,
    :updated_at,
    :master_template,
    :template_id,
    :submission_box_type,
    :submission_box_id,
    :submission_template_id,
    :test_status,
    :collection_to_test_id,
    :hide_submissions,
    :submissions_enabled,
    :anyone_can_view,
    :anyone_can_join,
    :cover_type,
    :archived,
    :unresolved_count,
    :last_unresolved_comment_id,
    :test_show_media,
    :idea_id,
    :search_term,
    :collection_type,
    :cloned_from_id,
    :num_columns,
  )

  stringified_attributes(
    :organization_id,
    :joinable_group_id,
    :default_group_id,
  )

  has_many :roles do
    data do
      @object.anchored_roles(viewing_organization_id: @current_user&.current_organization_id)
    end
  end

  has_many :collection_cover_items do
    data do
      @object.serial_collection_cover_items
    end
  end

  has_many :collection_cover_text_items
  has_one :parent_collection_card
  has_one :parent
  has_one :live_test_collection
  belongs_to :submissions_collection
  belongs_to :submission_template
  belongs_to :collection_to_test
  belongs_to :organization
  belongs_to :created_by
  belongs_to :template
  has_many :test_audiences
  has_one :test_results_collection
  has_many :collection_filters

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
    @object.cached_cover || DefaultCollectionCover.defaults
  end

  attribute :test_scores do
    @object.cached_test_scores || {}
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

  attribute :collection_card_count do
    @object.cached_card_count || 0
  end

  attribute :card_order, if: -> { @object == @current_record } do
    @card_order || 'order'
  end

  attribute :can_view do
    @search_collection ? true : @current_ability.can?(:read, @object)
  end

  attribute :can_edit do
    @search_collection ? false : @current_ability.can?(:edit, @object)
  end

  attribute :can_edit_content do
    # NOTE: this also ends up coming into play when you are an editor
    # but the collection is "pinned_and_locked"
    # -- also, if the collection is archived you can't edit content e.g. add/move cards
    @object.active? && @current_ability.can?(:edit_content, @object)
  end

  attribute :submissions_collection_id, if: -> { @object.is_a? Collection::SubmissionBox } do
    # might be nil before object exists
    @object.submissions_collection.try(:id)
  end

  attribute :is_private do
    @object.private?
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

  attribute :is_inside_hidden_submission_box do
    @inside_hidden_submission_box.nil? ?
      @object.inside_hidden_submission_box? :
      @inside_hidden_submission_box
  end

  attribute :submission_attrs, if: -> { @object.submission_attrs.present? } do
    @object.submission_attrs
  end

  attribute :is_inside_a_submission do
    @inside_a_submission.nil? ?
      @object.inside_a_submission? :
      @inside_a_submission
  end

  attribute :is_inside_a_challenge do
    @object.inside_a_challenge?
  end

  attribute :challenge_name do
    @object.parent_challenge&.name
  end

  attribute :challenge_id do
    @object.parent_challenge&.id
  end

  attribute :is_subtemplate_or_instance do
    @object.subtemplate? || @object.subtemplate_instance?
  end

  attribute :show_language_selector do
    @object.inside_an_application_collection?
  end

  attribute :template_num_instances do
    if @object.master_template?
      @object.templated_collections.active.count
    else
      0
    end
  end

  attribute :launchable, if: -> { @object.test_or_test_results_collection? } do
    @object.launchable?
  end

  attribute :gives_incentive, if: -> { @object.test_or_test_results_collection? } do
    @object.gives_incentive?
  end

  attribute :test_collection_id, if: -> { @object.is_a?(Collection::TestResultsCollection) } do
    @object.test_collection.id.to_s
  end

  attribute :awaiting_updates do
    @object.awaiting_updates?
  end

  attribute :num_survey_responses do
    @object.is_a?(Collection::TestCollection) ? @object.survey_responses.size : 0
  end

  attribute :max_row_index do
    @object.is_a?(Collection::Board) ? @object.max_row_index : nil
  end

  attribute :max_col_index do
    @object.is_a?(Collection::Board) ? @object.max_col_index : nil
  end

  attribute :frontend_url do
    @frontend_url_for.call(@object)
  end

  attribute :common_viewable do
    # only `true` if you're viewing the common resource outside of its home org
    @object.common_viewable? && @object.organization_id != @current_user.current_organization_id
  end

  attribute :is_test_locked do
    @object.try(:purchased?)
  end

  attribute :has_link_sharing do
    @object.try(:link_sharing?)
  end

  attribute :is_restorable do
    @object.try(:restorable?)
  end

  has_one :restorable_parent do
    @object.try(:restorable_parent)
  end

  attribute :cache_key, if: -> { @object == @current_record } do
    Digest::MD5.hexdigest(@object.cache_key(@card_order || 'order', @current_user.try(:id)))
  end

  attribute :serializer do
    'SerializableCollection'
  end
end
