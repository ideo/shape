# Use a MasterTemplate to build a new Collection
class CollectionTemplateBuilder < SimpleService
  attr_reader :collection, :errors

  def initialize(
    parent:,
    template:,
    placement: 'beginning',
    created_by: nil,
    create_parent_card: true,
    external_id: nil,
    collection_card_params: {},
    collection_params: {}
  )
    @parent = parent
    @template = template
    @placement = placement
    @created_by = created_by
    @collection = template.class.new
    @errors = @collection.errors
    @create_parent_card = create_parent_card
    @external_id = external_id
    @collection_card_params = collection_card_params.to_h.symbolize_keys
    @raw_collection_params = collection_params
  end

  def call
    return false unless create_collection

    place_collection_in_parent
    setup_submission_attrs if creating_a_submission?
    setup_template_cards
    # mainly so template_num_instances will be refreshed in API cache
    @template.touch
    setup_submission_test if creating_a_submission?
    # re-save to capture cover, new breadcrumb + tag lists
    @collection.cache_cover!
    @collection
  end

  private

  def create_collection
    unless @template.master_template?
      @collection.errors.add(:base, 'Can only build a template instance from a master template')
      return false
    end
    if @parent.inside_a_master_template?
      @collection.errors.add(:base, 'Can not create template instances inside of master templates')
      return false
    end

    # NOTE: Any issue with creating the template instance in a different org from the template?
    @collection = @template.templated_collections.create(collection_params)

    # make sure to assign these permissions before the template cards are generated
    @collection.inherit_roles_anchor_from_parent!(@parent)
    if creating_a_submission?
      @collection.unanchor_and_inherit_roles_from_anchor!
      if @parent.submission_box.hide_submissions
        # definitely could be a better way than copying the viewer roles only to delete them...
        @collection.roles.where(name: Role::VIEWER).destroy_all
      end
      @parent.follow_submission_box(@created_by)
      @created_by.upgrade_to_edit_role(@collection)
    end
    add_external_record
    add_collection_filters
    # capture newly added roles
    @collection.reload
    @collection
  end

  def collection_params
    {
      name: created_template_name,
      organization_id: @parent.organization.id,
      created_by_id: @created_by&.id,
      type: @template.type,
      tag_list: @template.tag_list,
      collection_type: @template.collection_type,
      num_columns: @template.num_columns,
    }.merge(@raw_collection_params)
  end

  def place_collection_in_parent
    if @create_parent_card
      card_params = default_collection_card_params.merge(
        @collection_card_params,
      )
      card = @parent.primary_collection_cards.create(card_params)
      card.increment_card_orders! if @placement != 'end'
    end
    @collection.recalculate_breadcrumb!
  end

  def setup_template_cards
    @template.setup_templated_collection(
      for_user: @created_by,
      collection: @collection,
      # async actually throws this off because it needs the first level of records to be created
      synchronous: :first_level,
    )
  end

  def created_template_name
    if creating_a_submission?
      "#{@created_by.first_name}'s #{@template.name}"
    elsif @template.child_of_a_master_template?
      @template.name
    else
      "My #{@template.name}"
    end
  end

  def order_placement
    last = @parent.collection_cards.count
    case @placement
    when 'beginning'
      0
    when 'end'
      last
    else
      @placement.is_a?(Integer) ? @placement : last
    end
  end

  def default_collection_card_params
    {
      width: 1,
      height: 1,
      pinned: @parent.master_template?,
      collection: @collection,
      order: order_placement,
    }
  end

  def setup_submission_attrs
    # this will get persisted when calling cache_cover!
    @collection.submission_attrs = { submission: true }
    @collection.submission_attrs['hidden'] = true if @parent.submission_box.hide_submissions?
    @collection.save
  end

  def setup_submission_test
    submission_template = @parent.submission_box.submission_template
    test_id = submission_template.try(:submission_attrs).try(:[], 'launchable_test_id')
    return unless test_id.present?

    master_test = Collection::TestCollection.find(test_id)
    master_test.update_submission_launch_status(@collection)
  end

  def creating_a_submission?
    @parent.is_a? Collection::SubmissionsCollection
  end

  def follow_submission_box
    comment_thread = @parent.submission_box.comment_thread
    return if comment_thread.nil? || @created_by.nil?

    users_thread = comment_thread.users_thread_for(@created_by)
    return if users_thread.present?

    comment_thread.add_user_follower!(@created_by.id)
  end

  def add_external_record
    return unless @external_id.present? && @created_by&.application.present?

    @collection.add_external_id(
      @external_id,
      @created_by.application.id,
    )
  end

  # Manually add any filters - since this doesn't use the duplicate! method
  def add_collection_filters
    @template.collection_filters.each do |collection_filter|
      collection_filter.duplicate!(
        assign_collection: @collection,
      )
    end
  end
end
