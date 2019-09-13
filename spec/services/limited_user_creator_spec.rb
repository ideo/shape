require 'rails_helper'

RSpec.describe LimitedUserCreator, type: :service do
  let(:contact_info) { 'ms@m.com' }
  let(:fake_user) do
    Hashie::Mash.new(
      uid: SecureRandom.hex(15),
      type: 'User::Limited',
      email: Faker::Internet.unique.email,
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

    it 'should leave the user feedback_contact_preference as unanswered' do
      limited_user_creator.call
      user = limited_user_creator.limited_user
      expect(user.feedback_contact_unanswered?).to be true
    end

    context 'with an email' do
      let(:contact_info) { 'mary@make.com' }

      it 'should return true' do
        expect(limited_user_creator.call).to be true
        expect(limited_user_creator.created).to be true
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

      context 'with an invalid phone number' do
        let(:contact_info) { '1251254' }

        it 'should return false with errors' do
          expect(limited_user_creator.call).to be false
        end
      end
    end

    context 'with a phone number' do
      let(:contact_info) { '920-423-9843' }

      it 'should create a user with normalized phone number' do
        expect(NetworkApi::User).to receive(:create).with(
          phone: '9204239843',
          limited_user: true,
        )
        limited_user_creator.call
      end
    end

    context 'with an existing user' do
      before do
        allow(NetworkApi::User).to receive(:where).and_return([fake_user])
      end

      it 'should set created = false' do
        limited_user_creator.call
        expect(limited_user_creator.created).to be false
      end
    end

    context 'with additional fields' do
      let(:contact_info) { 'mary@make.com' }
      let(:user_info) {
        {
          phone: '4154239843',
          first_name: 'Limited',
          last_name: 'User',
        }
      }

      it 'should create a user with the additional fields' do
        expect(NetworkApi::User).to receive(:create).with(
          email: contact_info,
          phone: user_info[:phone],
          first_name: user_info[:first_name],
          last_name: user_info[:last_name],
          limited_user: true,
        )
        LimitedUserCreator.call(contact_info: contact_info, user_info: user_info)
      end
    end

    context 'with spaces in the email' do
      let(:contact_info) { '  mary@make.com    ' }
      let(:user_info) {
        {
          first_name: 'Limited',
          last_name: 'User',
        }
      }

      it 'should create a user with the additional fields' do
        expect(NetworkApi::User).to receive(:create).with(
          email: 'mary@make.com',
          first_name: user_info[:first_name],
          last_name: user_info[:last_name],
          limited_user: true,
        )
        LimitedUserCreator.call(contact_info: contact_info, user_info: user_info)
      end
    end

    context 'with date of participation' do
      let(:contact_info) { 'mary@make.com' }
      let(:date_of_participation) { Time.now - 1.day }

      it 'should set created_at to the date of participation' do
        LimitedUserCreator.call(contact_info: contact_info, date_of_participation: date_of_participation)

        user = User.last
        expect(user.created_at.to_i).to eq(date_of_participation.to_i)
      end

      it 'should create a TestAudienceInvitation' do
        LimitedUserCreator.call(contact_info: contact_info, date_of_participation: date_of_participation)

        user = User.last
        invitation = TestAudienceInvitation.last
        expect(invitation.user).to eq(user)
        expect(invitation.created_at.to_i).to eq(date_of_participation.to_i)
      end
    end
  end
end
