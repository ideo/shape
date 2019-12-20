require 'rails_helper'

RSpec.describe CreateActivityNotificationsWorker, type: :worker do
  describe '#perform' do
    let(:activity) { create(:activity) }
    let(:omit_user_ids) { [] }
    let(:omit_group_ids) { [] }
    let(:combine) { true }

    it 'calls NotificationBuilder' do
      expect(NotificationBuilder).to receive(:call).with(
        activity: activity,
        omit_user_ids: omit_user_ids,
        omit_group_ids: omit_group_ids,
        combine: combine,
      )
      CreateActivityNotificationsWorker.new.perform(
        activity.id,
        omit_user_ids,
        omit_group_ids,
        combine,
      )
    end
  end
end
