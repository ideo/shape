require 'rails_helper'

RSpec.describe ActivityAndNotificationForCardWorker, type: :worker do
  describe '#perform' do
    let(:user) { create(:user) }
    let(:editor_group) { create(:group) }
    let(:from_collection) { create(:collection) }
    let(:to_collection) { create(:collection) }
    let(:item) { create(:text_item, add_editors: [user, editor_group]) }
    let(:card) { create(:collection_card, item: item) }
    let(:action) { 'moved' }

    let(:run_worker) do
      ActivityAndNotificationForCardWorker.new.perform(
        user.id,
        card.id,
        action,
        from_collection&.id,
        to_collection&.id,
      )
    end

    it 'should call ActivityAndNotificationBuilder' do
      expect(ActivityAndNotificationBuilder).to receive(:call).with(
        actor: user,
        target: item,
        action: action,
        subject_user_ids: [user.id],
        subject_group_ids: [editor_group.id],
        source: from_collection,
        destination: to_collection,
      )
      run_worker
    end
  end
end
