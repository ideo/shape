require 'rails_helper'

RSpec.describe MailingListSubscriptionWorker, type: :worker do
  let(:user) { create(:user) }
  let(:subscribe) { true }

  describe '#perform' do
    it 'calls MailingListSubscription with user' do
      expect(MailingListSubscription).to receive(:call).with(
        user: user,
        list: :shape_users,
        subscribe: subscribe,
      )
      MailingListSubscriptionWorker.new.perform(user.id, :shape_users, subscribe)
    end
  end
end
