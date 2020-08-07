require 'rails_helper'

describe Collection::SubmissionsCollection, type: :model do
  let(:submission_box) { create(:submission_box, submission_box_type: :template) }
  let(:submissions_collection) { create(:submissions_collection, submission_box: submission_box) }

  context 'associations' do
    it { should belong_to :submission_box }
  end

  describe '#parent' do
    it 'should return the submission_box for breadcrumb purposes' do
      expect(submissions_collection.parent).to eq submission_box
    end
  end

  describe '#submissions' do
    let!(:submitted_collections) { create_list(:collection, 2, parent_collection: submissions_collection) }
    let!(:submitted_items) { create_list(:text_item, 2, parent_collection: submissions_collection) }

    context 'with submission_box_type = template' do
      it 'should return the children collections' do
        expect(submissions_collection.submissions).to eq submitted_collections
      end
    end

    context 'with submission_box_type = text' do
      before do
        submission_box.update(submission_box_type: :text)
        submissions_collection.reload
      end

      it 'should return the children items' do
        expect(submissions_collection.submissions).to eq submitted_items
      end
    end
  end

  describe '#sort_options' do
    let(:submissions) { create_list(:collection, 2, parent_collection: submissions_collection) }
    before do
      submissions.first.update(cached_test_scores: { 'question_clarity' => 33 })
      submissions.second.update(cached_test_scores: { 'question_useful' => 33 })
    end

    it 'should return all available test score options' do
      expect(
        submissions_collection.sort_options,
      ).to match_array(
        [
          {
            question_type: 'question_clarity',
            question_title: 'Clarity',
          },
          {
            question_type: 'question_useful',
            question_title: 'Usefulness',
          },
        ],
      )
    end
  end
end
