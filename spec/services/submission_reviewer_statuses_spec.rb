require 'rails_helper'

RSpec.describe SubmissionReviewerStatuses, type: :service do
  let(:submissions) { [] }
  let(:challenge) { nil }

  subject do
    SubmissionReviewerStatuses.call(
      challenge: challenge,
      submissions: submissions,
    )
  end

  describe '#call' do
    it 'returns empty array if no submissions' do
      expect(subject).to be_a_success
      expect(subject.data).to eq([])
    end

    context 'with submissions' do
      let!(:challenge) { create(:collection, collection_type: :challenge) }
      let(:reviewer) { create(:user) }
      let(:submission) { create(:collection) }
      let!(:submissions) { [submission] }
      let!(:test_collection) { create(:test_collection, parent_collection: submission) }
      let!(:survey_response) { create(:survey_response, test_collection: test_collection, user: reviewer) }
      let(:launchable_test_id) { nil }

      before do
        submission.update(
          user_tag_list: [reviewer.handle],
          submission_attrs: { submission: true, launchable_test_id: launchable_test_id },
        )
      end

      context 'with no launchable_test_id yet' do
        it 'returns status as :unstarted for any tagged users' do
          expect(subject.data).to eq([
            {
              user_id: reviewer.id,
              status: :unstarted,
              record_id: submission.id,
            },
          ])
        end
      end

      context 'with a launchable_test_id' do
        let(:launchable_test_id) { test_collection.id }

        it 'returns survey_response status for each tagged user' do
          expect(subject.data).to eq([
            {
              user_id: reviewer.id,
              status: :in_progress,
              record_id: submission.id,
            },
          ])
        end
      end
    end
  end
end
