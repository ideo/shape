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
  end

  private

  def create_collection
    unless @template.master_template?
      @collection.errors.add(:base, 'Can only build a template instance from a master template')
      return false
    end

    @collection = @template.templated_collections.create(
      name: "My #{@template.name}",
      organization: @template.organization,
    )
    @template.setup_templated_collection(
      for_user: @created_by,
      collection: @collection,
    )
    @collection
  end
end
