require 'rails_helper'

RSpec.describe CreatePendingUsers, type: :service do
  let(:emails) { Array.new(3).map { Faker::Internet.email } }

  describe '#call' do
    let(:emails) { Array.new(3).map { Faker::Internet.email } }
    let(:subject) { CreatePendingUsers.new(emails) }

    it 'should return pending users for all emails' do
      subject.call
      expect(subject.users.all? { |user| user.persisted? && user.pending? }).to be true
      expect(subject.users.map(&:email)).to match_array(emails)
      expect(subject.failed_emails).to be_empty
    end

    it 'should strip any whitespace' do
      cpu = CreatePendingUsers.new(['email@address.com '])
      cpu.call
      expect(cpu.users.first.email).to eq('email@address.com')
    end

    context 'existing user with email' do
      let!(:user) { create(:user, email: emails.first) }

      it 'should not create a new user, but return existing user' do
        expect { subject.call }.to change(User, :count).by(2)
        expect(subject.users).to include(user)
      end

      it 'should not be case sensitive' do
        user.update_attributes(email: emails.first.upcase)
        expect { subject.call }.to change(User, :count).by(2)
      end
    end
  end
end
