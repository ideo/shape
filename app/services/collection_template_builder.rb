# Use a MasterTemplate to build a new Collection
class CollectionTemplateBuilder
  attr_reader :collection, :errors

  def initialize(parent:, template:, placement: 'beginning', created_by: nil, parent_card: nil)
    @parent = parent
    @template = template
    @placement = placement
    @created_by = created_by
    @collection = template.class.new
    @errors = @collection.errors
    @parent_card = parent_card
  end

  def call
    return false unless create_collection
    place_collection_in_parent
    setup_template_cards
    # mainly so template_num_instances will be refreshed in API cache
    @template.touch
    setup_submission if creating_a_submission?
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

    # NOTE: Any issue with creating the template instance in a different org from the template?
    @collection = @template.templated_collections.create(
      name: created_template_name,
      organization: @parent.organization,
      created_by: @created_by,
    )
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
    # capture newly added roles
    @collection.reload
    @collection
  end

  def place_collection_in_parent
    unless @parent_card.present?
      card = @parent.primary_collection_cards.create(
        width: 1,
        height: 1,
        pinned: @parent.master_template?,
        collection: @collection,
        order: order_placement,
      )
      card.increment_card_orders! if @placement == 'beginning'
    end
    @collection.recalculate_breadcrumb!
  end

  def setup_template_cards
    @template.setup_templated_collection(
      for_user: @created_by,
      collection: @collection,
    )
  end

  def created_template_name
    if creating_a_submission?
      "#{@created_by.first_name}'s #{@template.name}"
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

  def setup_submission
    # this will get persisted when calling cache_cover!
    @collection.submission_attrs = { submission: true }
    if @parent.submission_box.hide_submissions
      @collection.submission_attrs['hidden'] = true
    end
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
    return if comment_thread.nil?
    users_thread = comment_thread.users_thread_for(@created_by)
    return if users_thread.present?
    comment_thread.add_user_follower!(@created_by.id)
  end
end
