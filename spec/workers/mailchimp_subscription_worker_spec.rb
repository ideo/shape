require 'rails_helper'

RSpec.describe MailchimpSubscriptionWorker, type: :worker do
  let(:user) { create(:user) }

  describe '#perform' do
    it 'calls MailchimpSubscription with user' do
      expect(MailchimpSubscription).to receive(:call).with(
        user: user,
      )
      MailchimpSubscriptionWorker.new.perform(user.id)
    end
  end
end
