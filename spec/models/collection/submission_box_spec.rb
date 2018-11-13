require 'rails_helper'

describe Collection::SubmissionBox, type: :model do
  context 'associations' do
    it { should belong_to :submission_template }
    it { should have_one :submissions_collection }
  end

  context 'validations' do
    let(:submission_box) { create(:submission_box) }

    it 'should reject submission_template if not a master_template' do
      submission_box.update(submission_template: create(:collection))
      expect(
        submission_box.errors[:submission_template],
      ).to include('must be a Master Template')
    end

    it 'should validate submission_template is a master_template' do
      expect(
        submission_box.update(submission_template: create(:collection, master_template: true)),
      ).to be true
    end
  end

  describe '#duplicate!' do
    let(:user) { create(:user) }
    let(:parent_collection) { create(:collection) }
    # duplicate! method expects a parent_collection to be present
    let(:submission_box) { create(:submission_box, parent_collection: parent_collection) }
    let(:duplicate) { submission_box.duplicate!(for_user: user) }

    before do
      submission_box.setup_submissions_collection!
    end

    it 'should also create its own submissions_collection' do
      expect(submission_box.submissions_collection.present?).to be true
      expect(duplicate.submissions_collection.present?).to be true
      expect(duplicate.submissions_collection).not_to eq submission_box.submissions_collection
    end
  end

  describe '#archive' do
    let(:submission_box) { create(:submission_box) }

    before do
      submission_box.setup_submissions_collection!
    end

    it 'should also archive the submissions_collection' do
      expect(submission_box.archived?).to be false
      expect(submission_box.submissions_collection.archived?).to be false
      submission_box.archive!
      expect(submission_box.archived?).to be true
      expect(submission_box.submissions_collection.archived?).to be true
    end
  end

  describe '#children' do
    let(:submission_box) { create(:submission_box) }
    let!(:text_card) { create(:collection_card_text, parent: submission_box) }

    context 'with submissions_collection' do
      let(:submissions_collection) { submission_box.submissions_collection }
      let(:subcollection) { create(:collection, parent_collection: submissions_collection, num_cards: 2) }

      before do
        submission_box.setup_submissions_collection!
        # have to persist all the new relations
        submission_box.reload
        subcollection.reload
        submissions_collection.reload
      end

      it 'should include the submissions_collection children' do
        expect(submission_box.children).to include(text_card.item)
        expect(submission_box.children).to include(subcollection)
      end
    end

    context 'with no submissions_collection' do
      it 'should defer to the usual method' do
        submission_box.reload
        expect(submission_box.children).to match_array([text_card.item])
      end
    end
  end
end
