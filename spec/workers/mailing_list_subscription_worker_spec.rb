require 'rails_helper'

RSpec.describe MailingListSubscriptionWorker, type: :worker do
  let(:user) { create(:user) }
  let(:subscribe) { true }

  describe '#perform' do
    it 'calls MailingListSubscription with user' do
      expect(MailingListSubscription).to receive(:call).with(
        user: user,
        subscribe: subscribe,
      )
      MailingListSubscriptionWorker.new.perform(user.id, subscribe)
    end
  end
end
