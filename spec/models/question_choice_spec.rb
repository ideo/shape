require 'rails_helper'

RSpec.describe QuestionChoice, type: :model do
  let(:question_choice) { create(:question_choice) }

  describe 'duplicate!' do
    context 'with assigned question' do
      let(:assign_question) { create(:question_item) }

      it 'should duplicate the question choice' do
        dup = question_choice.duplicate!(assign_question: assign_question)

        expect(dup.text).to eq(question_choice.text)
        expect(dup.question). to equal(assign_question)
      end
    end
  end
end
