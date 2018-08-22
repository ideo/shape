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
end
