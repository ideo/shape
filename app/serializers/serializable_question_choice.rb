class SerializableQuestionChoice < BaseJsonSerializer
  type 'question_choices'
  attributes :text,
             :order,
             :question_item_id

  attribute :value do
    @object.value.to_s
  end
end
