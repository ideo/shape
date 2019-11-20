require 'rails_helper'

RSpec.describe MarkAsPrivate, type: :service do
  let(:user) { create(:user) }
  let(:organization) { create(:organization) }
  let!(:collection) { create(:collection, add_editors: [user]) }
  subject do
    MarkAsPrivate.new(
      object: collection,
      marked_by: user,
    )
  end

  describe '#call' do
    context 'marking collection as private' do
      it 'should mark the collection as private' do
        expect(ActivityAndNotificationBuilder).to receive(:call).with(
          hash_including(action: :made_private),
        ).once
        subject.call
        expect(collection.cached_inheritance['private']).to be_truthy
      end
    end
  end
end
