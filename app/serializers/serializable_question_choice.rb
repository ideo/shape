class SerializableQuestionChoice < BaseJsonSerializer
  type 'question_choices'
  attributes :text,
             :order,
             :value,
             :question_item_id
end
