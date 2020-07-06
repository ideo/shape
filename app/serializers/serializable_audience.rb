class SerializableAudience < BaseJsonSerializer
  type 'audiences'
  attributes :name, :global_default, :audience_type

  Audience.tag_types.each do |tag_type|
    # much more efficient to pull these tag_lists out of audience.all_tags
    attribute :"#{tag_type.to_s.singularize}_list" do
      @object.all_tags[tag_type] || []
    end
  end

  attribute :min_price_per_response do
    @object.min_price_per_response.to_f
  end

  attribute :order do
    # this is an attribute that may be attached via #viewable_by_user_in_org query
    @object.try(:order)
  end

  attribute :global do
    # an audience is belongs to all organizations if it does not belong to an org
    # and is not set glopbal by default, ie: Link Sharing
    @object.organizations.empty?
  end
end
