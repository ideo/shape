require 'rails_helper'

RSpec.describe NotifyFeedbackCompletedWorker, type: :worker do
  describe '#perform' do
    let(:test_collection) { create(:test_collection) }
    let(:editor) { create(:user) }
    let(:group_editor) { create(:user) }
    let(:group) { create(:group, add_admins: [group_editor]) }

    before do
      editor.add_role(Role::EDITOR, test_collection)
      group.add_role(Role::EDITOR, test_collection)
      allow(TestCollectionMailer).to receive(:notify_closed).and_call_original
    end

    it 'calls TestCollectionMailer.notify_closed for all editors' do
      expect(TestCollectionMailer).to receive(:notify_closed).with(
        collection_id: test_collection.id,
        user_id: editor.id,
      ).once

      expect(TestCollectionMailer).to receive(:notify_closed).with(
        collection_id: test_collection.id,
        user_id: group_editor.id,
      ).once

      NotifyFeedbackCompletedWorker.new.perform(test_collection.id)
    end
  end
end
