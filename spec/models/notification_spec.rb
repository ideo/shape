require 'rails_helper'

RSpec.describe Notification, type: :model do
  context 'associations' do
    it { should belong_to :activity }
    it { should belong_to :user }
  end

  describe 'with combined activities' do
    let(:activities) { create_list(:activity, 3) }
    let(:notification) { create(:notification, combined_activities_ids: activities.map(&:id)) }

    describe '#combined_actor_ids' do
      it 'should find all actor_ids from the combined_activities' do
        expect(notification.combined_actor_ids).to match_array(activities.pluck(:actor_id))
      end
    end
  end
end
