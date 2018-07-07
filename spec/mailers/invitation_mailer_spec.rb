require 'rails_helper'

RSpec.describe InvitationMailer, type: :mailer do
  describe '#invite' do
    let(:user) { create(:user, :pending) }
    let(:invited_by) { create(:user) }
    let(:collection) { create(:collection) }
    let(:mail) do
      InvitationMailer.invite(
        user_id: user.id,
        invited_by_id: invited_by.id,
        invited_to_type: collection.class.name,
        invited_to_id: collection.id,
      )
    end

    it 'renders the headers' do
      expect(mail.subject).to eq("Your invitation to \"#{collection.name}\" on Shape")
      expect(mail.to).to eq([user.email])
    end

    it 'renders the body' do
      expect(mail.body.encoded).to match("#{invited_by.name} has invited you to join \"#{collection.name}\"")
    end
  end
end
