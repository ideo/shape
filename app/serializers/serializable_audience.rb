class SerializableAudience < BaseJsonSerializer
  type 'audiences'
  attributes(
    :name,
    :criteria,
    :age_list,
    :children_age_list,
    :country_list,
    :education_level_list,
    :gender_list,
    :adopter_type_list,
    :interest_list,
    :publication_list
  )

  attribute :price_per_response do
    @object.price_per_response.to_f
  end

  attribute :order do
    # this is an attribute that may be attached via #viewable_by_user_in_org query
    @object.try(:order)
  end
end
