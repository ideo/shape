require 'rails_helper'

RSpec.describe LimitedUserCreator, type: :service do
  let(:contact_info) { 'ms@m.com' }
  let(:fake_user) do
    Hashie::Mash.new(
      uid: SecureRandom.hex(15),
      type: 'User::Limited',
      email:  Faker::Internet.unique.email,
      phone: Faker::PhoneNumber.cell_phone,
      first_name: Faker::Name.first_name,
      last_name: Faker::Name.last_name,
      username: Faker::Internet.unique.slug,
      extra: {},
    )
  end
  let(:limited_user_creator) do
    LimitedUserCreator.new(
      contact_info: contact_info,
    )
  end

  before do
    allow(NetworkApi::User).to receive(:create).and_return(fake_user)
    allow(NetworkApi::User).to receive(:where).and_return([])
  end

  describe '#call' do
    it 'should create a new user' do
      expect do
        limited_user_creator.call
      end.to change(User, :count).by(1)
    end

    it 'should set the user status to limited' do
      limited_user_creator.call
      expect(limited_user_creator.limited_user.status).to eq 'limited'
    end

    context 'with an email' do
      let(:contact_info) { 'mary@make.com' }

      it 'should return true' do
        expect(limited_user_creator.call).to be true
      end

      it 'should create create a user on the network api with email' do
        expect(NetworkApi::User).to receive(:create).with(
          email: contact_info,
          limited_user: true,
        )
        limited_user_creator.call
      end

      context 'with an invalid email' do
        let(:contact_info) { 'marmake.com' }

        it 'should return false with errors' do
          expect(limited_user_creator.call).to be false
        end
      end
    end

    context 'with a phone number' do
      let(:contact_info) { '415-423-9843' }

      it 'should create a user with normalized phone number' do
        expect(NetworkApi::User).to receive(:create).with(
          phone: '4154239843',
          limited_user: true,
        )
        limited_user_creator.call
      end
    end
  end
end
