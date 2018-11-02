require 'rails_helper'

describe Collection::SubmissionsCollection, type: :model do
  context 'associations' do
    it { should belong_to :submission_box }
  end

  describe '#parent' do
    let(:submission_box) { create(:submission_box) }
    let(:submissions_collection) { create(:submissions_collection, submission_box: submission_box) }
    it 'should return the submission_box for breadcrumb purposes' do
      expect(submissions_collection.parent).to eq submission_box
    end
  end

  describe '#sort_options' do
    let(:submission_box) { create(:submission_box) }
    let(:submissions_collection) { create(:submissions_collection, submission_box: submission_box) }
    let(:submissions) { create_list(:collection, 2, parent_collection: submissions_collection) }
    before do
      submissions.first.update(cached_test_scores: { 'question_clarity' => 33 })
      submissions.second.update(cached_test_scores: { 'question_useful' => 33 })
    end

    it 'should return all available test score options' do
      expect(submissions_collection.sort_options).to match_array(%w[question_clarity question_useful])
    end
  end
end
