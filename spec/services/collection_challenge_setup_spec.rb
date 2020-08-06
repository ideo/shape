require 'rails_helper'

RSpec.describe CollectionChallengeSetup, type: :service do
  let(:organization) { create(:organization) }
  let(:user) { create(:user, current_organization: organization) }
  let(:collection) { create(:collection, organization: organization, collection_type: 'challenge', created_by: user) }
  let(:challenge_setup) { CollectionChallengeSetup.new(collection: collection, user: user) }

  describe '#call' do
    it 'should create a challenge admin group, participant group, and reviewer group' do
      challenge_setup.call
      admin_group = collection.challenge_admin_group
      reviewer_group = collection.challenge_reviewer_group
      participant_group = collection.challenge_participant_group
      expect(admin_group.present?).to be true
      expect(reviewer_group.present?).to be true
      expect(reviewer_group.present?).to be true
      expect(admin_group.can_edit?(user)).to be true
      expect(reviewer_group.can_edit?(user)).to be true
      expect(participant_group.can_edit?(user)).to be true
      expect(reviewer_group.can_edit?(admin_group)).to be true
      expect(participant_group.can_edit?(admin_group)).to be true
    end
  end
end
