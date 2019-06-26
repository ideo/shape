class SerializableAudience < BaseJsonSerializer
  type 'audiences'
  attributes :name

  Audience.tag_types.each do |tag_type|
    # much more efficient to pull these tag_lists out of audience.all_tags
    attribute :"#{tag_type.to_s.singularize}_list" do
      @object.all_tags[tag_type] || []
    end
  end

  attribute :price_per_response do
    @object.price_per_response.to_f
  end

  attribute :order do
    # this is an attribute that may be attached via #viewable_by_user_in_org query
    @object.try(:order)
  end
end
