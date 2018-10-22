class SerializableTestCollection < SerializableSimpleCollection
  type 'collections'

  attributes :test_status

  has_many :collection_cards do
    data do
      @object.try(:test_design).try(:complete_collection_cards)
    end
  end

  attribute :survey_response_for_user_id do
    @survey_response_for_user.try(:id)
  end
end
