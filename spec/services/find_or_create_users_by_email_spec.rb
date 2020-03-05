require 'rails_helper'

RSpec.describe FindOrCreateUsersByEmail, type: :service do
  describe '#call' do
    # needs to have a current_org to pass through to the invitation
    let!(:invited_by) { create(:user, current_organization_id: 1) }
    let(:emails) { Array.new(3).map { Faker::Internet.email } }
    let(:subject) do
      FindOrCreateUsersByEmail.new(
        emails: emails,
        invited_by: invited_by,
      )
    end
    let(:invited_emails) { emails }
    let(:fake_invitations) do
      invited_emails.map do |email|
        Mashie.new(email: email, token: SecureRandom.alphanumeric(12))
      end
    end

    before do
      allow(NetworkApi::Invitation).to receive(:bulk_create).and_return(
        fake_invitations,
      )
    end

    it 'should return pending users for all emails' do
      subject.call
      expect(subject.users.all? { |user| user.persisted? && user.pending? }).to be true
      expect(subject.users.map(&:email)).to match_array(emails)
      expect(subject.failed_emails).to be_empty
    end

    it 'should create network_invitations for each user' do
      expect(NetworkApi::Invitation).to receive(:bulk_create).with(
        organization_id: invited_by.current_organization_id,
        invited_by_uid: invited_by.uid,
        emails: emails,
      )
      subject.call
      user = subject.users.first
      expect(user.network_invitations.first.token).to eq fake_invitations.first.token
    end

    context 'with an email with whitespace' do
      let(:emails) { ['email@address.com  '] }

      it 'should strip any whitespace' do
        subject.call
        expect(subject.users.first.email).to eq('email@address.com')
      end
    end

    context 'with invalid email' do
      let(:emails) { ['#T)(#HTgneoin)'] }

      it 'should return failed_emails' do
        expect(subject.call).to eq false
        expect(subject.failed_emails).to match_array(emails)
      end
    end

    context 'with empty response from API' do
      let(:fake_invitations) { [] }

      it 'should return emails with errors from the invitations' do
        expect(subject.call).to eq false
        expect(subject.failed_emails).to match_array(emails)
      end
    end

    context 'with error response from API' do
      let(:fake_invitations) { Mashie.new(errors: ['Bad Request']) }

      it 'should return emails with errors from the invitations' do
        expect(subject.call).to eq false
        expect(subject.failed_emails).to match_array(emails)
      end
    end

    context 'with email rejected by API' do
      let(:fake_invitations) do
        invited_emails.map do |email|
          # if API call was unable to create an invite for that email, token will be nil
          Mashie.new(email: email, token: nil)
        end
      end

      it 'should return failed_emails' do
        expect(subject.call).to eq false
        expect(subject.failed_emails).to match_array(emails)
      end
    end

    context 'existing user with email' do
      let(:existing_email) { emails.first }
      let!(:user) { create(:user, email: existing_email) }
      let(:invited_emails) { emails - [existing_email] }

      it 'should not create a new user, but return existing user' do
        expect(NetworkApi::Invitation).to receive(:bulk_create).with(
          organization_id: invited_by.current_organization_id,
          invited_by_uid: invited_by.uid,
          emails: invited_emails,
        )
        expect { subject.call }.to change(User.pending, :count).by(2)
        expect(subject.users).to include(user)
      end

      it 'should not be case sensitive' do
        user.update_attributes(email: existing_email.upcase)
        expect { subject.call }.to change(User.pending, :count).by(2)
      end
    end
  end
end
