require 'rails_helper'

RSpec.describe MailingListSubscription, type: :service do
  describe '#call' do
    let(:fake_request) { double('gibbon') }
    let(:user) { create(:user) }

    before do
      allow(::Request).to receive_message_chain('new.lists.members') { fake_request }
    end

    context 'with subscribe' do
      it 'should call Network API' do
        expect(fake_request).to receive('upsert').with(
          body: {
            email_address: user.email,
            status: 'subscribed',
            merge_fields: { FNAME: user.first_name, LNAME: user.last_name },
            interests: { MailingListSubscription::SHAPE_ID => true },
          },
        )
        MailingListSubscription.call(user: user, subscribe: true)
      end
    end

    context 'with unsubscribe' do
      it 'should call NetworkApi::' do
        expect(fake_request).to receive('update').with(
          body: { status: 'unsubscribed' },
        )
        MailingListSubscription.call(user: user, subscribe: false)
      end
    end
  end
end
