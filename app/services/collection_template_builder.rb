# Use a MasterTemplate to build a new Collection
class CollectionTemplateBuilder
  attr_reader :collection, :errors

  def initialize(parent:, template:, placement: 'beginning', created_by: nil)
    @parent = parent
    @template = template
    @placement = placement
    @created_by = created_by
    @collection = Collection.new
    @errors = @collection.errors
  end

  def call
    return false unless create_collection
    place_collection_in_parent
    # re-save to capture new breadcrumb + tag lists
    @collection.save
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
      name: "My #{@template.name}",
      organization: @parent.organization,
    )
    # make sure to assign these permissions before the template cards are generated
    assign_submission_permissions
    @created_by.add_role(Role::EDITOR, @collection)
    @template.setup_templated_collection(
      for_user: @created_by,
      collection: @collection,
    )
    @collection
  end

  def assign_submission_permissions
    # this only applies to submissions into a submissions collection
    return unless @parent.is_a? Collection::SubmissionsCollection
    # all the roles come from the submission box (editors, viewers)
    # NOTE: this will create Viewer/Editor roles so make sure this runs before
    # calling any `add_role` functions e.g. @created_by.add_role... above
    @parent.submission_box.roles.each do |role|
      role.duplicate!(assign_resource: @collection)
    end
  end

  def place_collection_in_parent
    card = @parent.primary_collection_cards.create(
      width: 1,
      height: 1,
      pinned: @parent.master_template?,
      collection: @collection,
      order: @placement == 'beginning' ? 0 : @parent.collection_cards.count,
    )
    card.increment_card_orders! if @placement == 'beginning'
  end
end
