require 'rails_helper'

RSpec.describe RestorePermission, type: :service do
  let(:user) { create(:user) }
  let(:organization) { create(:organization) }
  let!(:collection) { create(:collection, add_editors: [user]) }
  let!(:child) { create(:collection, parent_collection: collection, add_editors: [user]) }
  subject do
    RestorePermission.new(
      object: child,
      restored_by: user,
    )
  end

  describe '#call' do
    context 'restoring child collection permission' do
      it 'should mark the collection as private' do
        expect(ActivityAndNotificationBuilder).to receive(:call).with(
          hash_including(action: :permissions_restored),
        ).once
        expect(child.cached_inheritance['private']).to be_falsy
        subject.call
      end
    end
  end
end
