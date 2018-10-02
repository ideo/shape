require 'rails_helper'

RSpec.describe MailchimpSubscription, type: :service do
  describe '#call' do
    let(:fake_request) { double('gibbon') }
    before do
      allow(Gibbon::Request).to receive_message_chain('new.lists.members') { fake_request }
    end

    context 'with subscribe' do
      let(:user) { create(:user, mailing_list: true) }

      it 'should call Gibbon API with user and "subscribed"' do
        expect(fake_request).to receive('upsert').with(
          body: {
            email_address: user.email,
            status: 'subscribed',
            merge_fields: { FNAME: user.first_name, LNAME: user.last_name },
            interests: { MailchimpSubscription::SHAPE_ID => true },
          },
        )
        MailchimpSubscription.call(user: user)
      end
    end

    context 'with unsubscribe' do
      let(:user) { create(:user, mailing_list: false) }

      it 'should call Gibbon API with user and "unsubscribed"' do
        expect(fake_request).to receive('update').with(
          body: { status: 'unsubscribed' },
        )
        MailchimpSubscription.call(user: user)
      end
    end
  end
end
