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
    setup_template_cards
    # mainly so template_num_instances will be refreshed in API cache
    @template.touch
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
    @collection.inherit_roles_from_parent!(@parent)
    # capture newly added roles
    @collection.reload
    @created_by.add_role(Role::EDITOR, @collection)
    @collection
  end

  def setup_template_cards
    @template.setup_templated_collection(
      for_user: @created_by,
      collection: @collection,
    )
  end

  def created_template_name
    if @parent.is_a? Collection::SubmissionsCollection
      "#{@created_by.first_name}'s #{@template.name}"
    else
      "My #{@template.name}"
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
    @collection.recalculate_breadcrumb!
  end
end
