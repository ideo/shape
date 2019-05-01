require 'rails_helper'

RSpec.describe LimitedUserCreator, type: :service do
  let(:contact_info) { 'ms@m.com' }
  let(:fake_user) { create(:user) }
  let(:limited_user_creator) do
    LimitedUserCreator.new(
      contact_info: contact_info,
    )
  end

  before do
    allow(NetworkApi::User).to receive(:create).and_return(fake_user)
  end

  describe '#call' do
    let!(:finished_call) { limited_user_creator.call }

    it 'should set the user status to limited' do
      expect(User.last.status).to eq 'limited'
    end

    context 'with an email' do
      let(:contact_info) { 'mary@make.com' }

      it 'should return true' do
        expect(finished_call).to be true
      end

      it 'should create create a user on the network api with email' do
        expect(NetworkApi::User).to receive(:create).with(
          email: contact_info,
          phone: nil,
          limited_user: true,
        )
        limited_user_creator.call
      end

      context 'with an invalid email' do
        let(:contact_info) { 'marmake.com' }

        it 'should return false with errors' do
          expect(finished_call).to be false
        end
      end
    end

    context 'with a phone number' do
      let(:contact_info) { '415-423-9843' }

      it 'should create a user with normalized phone number' do
        expect(NetworkApi::User).to receive(:create).with(
          email: nil,
          phone: '4154239843',
          limited_user: true,
        )
        limited_user_creator.call
      end
    end
  end
end
