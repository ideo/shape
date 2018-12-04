require 'rails_helper'

describe Testable, type: :concern do
  context 'with scored collections' do
    let(:collection) { create(:collection, :submission) }
    let(:test_collection) { create(:test_collection, collection_to_test: collection, test_status: :live) }
    let(:useful_question) { test_collection.question_items.where(question_type: :question_useful).first }
    let(:clarity_question_card) { create(:collection_card_question, parent: test_collection) }
    let(:clarity_question) { clarity_question_card.item }
    let(:survey_responses) { create_list(:survey_response, 3, test_collection: test_collection, status: :completed) }

    before do
      collection.submission_attrs['launchable_test_id'] = test_collection.id
      collection.save
      clarity_question.update(question_type: :question_clarity)
      survey_responses.each_with_index do |sr, i|
        sr.question_answers.create(question: useful_question, answer_number: i + 1)
        sr.question_answers.create(question: clarity_question, answer_number: i + 2)
      end
    end

    describe '#collect_test_scores' do
      it 'should return empty for an unscored collection' do
        expect(test_collection.collect_test_scores).to be_empty
      end

      it 'should collect all the scale question scores' do
        # useful answers 1, 2, 3 == 0, 1, 2 on a scale of 3... 3/9 total = 33%
        # clarity answers 2, 3, 4 == 1, 2, 3 on a scale of 3... 6/9 total = 67%
        expect(collection.collect_test_scores).to eq(
          'question_useful' => 33,
          'question_clarity' => 67,
          'total' => 50,
        )
      end
    end

    describe '.order_by_score' do
      let!(:other_scored_collection) do
        create(:collection, cached_test_scores: {
                 'question_useful' => 50,
                 'question_clarity' => 10,
                 'total' => 30,
               })
      end
      let!(:non_scored_collection) { create(:collection) }

      before do
        collection.update(
          cached_test_scores: {
            'question_useful' => 33,
            'question_clarity' => 70,
            'question_different' => 20,
            'total' => 41,
          },
        )
      end

      it 'should return the highest scoring collections in order' do
        expect(Collection.order_by_score('question_useful').first).to eq other_scored_collection
        expect(Collection.order_by_score('question_clarity').first).to eq collection
        expect(Collection.order_by_score('total').first).to eq collection
        # nulls should go last
        expect(Collection.order_by_score('question_different').first).to eq collection
      end

      it 'should only return scored collections' do
        expect(Collection.order_by_score('question_clarity').count).to eq 2
        expect(Collection.order_by_score('total').count).to eq 2
      end
    end
  end
end
