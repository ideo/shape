require 'rails_helper'

RSpec.describe InvitationMailer, type: :mailer do
  describe '#invite' do
    let(:user) { create(:user, :pending) }
    let(:mail) { InvitationMailer.invite(user.id) }

    it 'renders the headers' do
      expect(mail.subject).to eq('You have been invited to use Shape.')
      expect(mail.to).to eq([user.email])
    end

    it 'renders the body' do
      expect(mail.body.encoded).to match('You have been invited to join your organization on Shape.')
    end
  end
end
