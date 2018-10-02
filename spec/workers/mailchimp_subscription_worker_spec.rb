require 'rails_helper'

RSpec.describe MailchimpSubscriptionWorker, type: :worker do
  let(:user) { create(:user) }
  let(:subscribe) { true }

  describe '#perform' do
    it 'calls MailchimpSubscription with user' do
      expect(MailchimpSubscription).to receive(:call).with(
        user: user,
        subscribe: subscribe,
      )
      MailchimpSubscriptionWorker.new.perform(user.id, subscribe)
    end
  end
end
