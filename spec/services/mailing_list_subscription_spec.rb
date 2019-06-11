require 'rails_helper'

RSpec.describe MailingListSubscription, type: :service do
  describe '#call' do
    let(:mailing_list) { double('NetworkApi::MailingList', id: 'list-123') }
    let(:mailing_list_membership) { double('NetworkApi::MailingList', id: 'membership-123') }
    before do
      network_organization_doubles
      network_mailing_list_doubles(
        mailing_list: mailing_list,
        mailing_list_membership: mailing_list_membership,
      )
    end
    let(:organization) { create(:organization) }
    let(:user) { create(:user, add_to_org: organization) }

    context 'with subscribe to shape_users' do
      it 'calls NetworkApi::MailingListMembership.create' do
        expect(NetworkApi::MailingListMembership).to receive(:create).with(
          mailing_list_id: 'list-123',
          organization_ids: ['network-org-123'],
          user_uid: user.uid,
        )
        MailingListSubscription.call(
          user: user,
          list: :shape_users,
          subscribe: true,
        )
      end
    end

    context 'with subscribe to products_mailing_list' do
      it 'calls NetworkApi::MailingListMembership.create' do
        expect(NetworkApi::MailingListMembership).to receive(:create).with(
          mailing_list_id: 'list-123',
          user_uid: user.uid,
          interest_ids: [MailingListSubscription::SHAPE_INTEREST_ID],
        )
        MailingListSubscription.call(
          user: user,
          list: :products_mailing_list,
          subscribe: true,
        )
      end
    end

    context 'with unsubscribe' do
      it 'calls NetworkApi::MailingListMembership#destroy' do
        expect(mailing_list_membership).to receive(:destroy)
        MailingListSubscription.call(
          user: user,
          list: :shape_users,
          subscribe: false,
        )
      end
    end
  end
end
