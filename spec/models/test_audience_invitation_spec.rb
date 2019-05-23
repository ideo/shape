require 'rails_helper'

RSpec.describe TestAudienceInvitation, type: :model do
  let(:test_collection) { create(:test_collection) }
  let(:test_audience) { create(:test_audience, test_collection: test_collection) }
  let(:user) { create(:user) }

  context 'associations' do
    it { should belong_to :test_audience }
    it { should belong_to :user }
  end

  context 'callbacks' do
    describe '#generate_uniq_invitation_token' do
      let(:test_audience_invitation) { build(:test_audience_invitation, test_audience: test_audience, user: user) }

      it 'should generate a unique invitation_token' do
        expect {
          test_audience_invitation.save
        }.to change(test_audience_invitation, :invitation_token)
        expect(test_audience_invitation.invitation_token).not_to be nil
      end
    end
  end

  describe '#complete!' do
    let(:test_audience_invitation) { create(:test_audience_invitation, test_audience: test_audience, user: user) }

    it 'should update completed_at and clear out invitation_token' do
      expect {
        test_audience_invitation.complete!
      }.to change(test_audience_invitation, :completed_at)
      expect(test_audience_invitation.invitation_token).to be nil
      expect(test_audience_invitation.completed_at).not_to be nil
    end
  end
end
