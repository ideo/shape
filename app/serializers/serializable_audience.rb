class SerializableAudience < BaseJsonSerializer
  type 'audiences'
  attributes :name, :global_default

  # TODO: remove when demographic tags are deprecated
  Audience.tag_types.each do |tag_type|
    # much more efficient to pull these tag_lists out of audience.all_tags
    attribute :"#{tag_type.to_s.singularize}_list" do
      @object.all_tags[tag_type] || []
    end
  end

  attribute :demographic_criteria do
    response = []

    audience_criteria_keys = @object.audience_demographic_criteria.map(&:criteria_key)
    categories = DemographicsConfig.new.query_categories

    categories.each do |category|
      criteria_from_category = []

      category[:criteria].each do |criteria|
        next unless audience_criteria_keys.include? criteria[:criteriaKey]

        criteria_from_category << criteria[:name]
      end

      next if criteria_from_category.empty?

      response << {
        categoryName: category[:name],
        criteriaNames: criteria_from_category,
      }
    end

    response
  end

  attribute :price_per_response do
    @object.price_per_response.to_f
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
