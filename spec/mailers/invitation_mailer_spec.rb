require 'rails_helper'

RSpec.describe InvitationMailer, type: :mailer do
  describe '#invite' do
    let(:user) { create(:user, :pending) }
    let(:invited_by) { create(:user) }
    let(:organization) { create(:organization) }
    let(:mail) do
      InvitationMailer.invite(
        user_id: user.id,
        invited_by_id: invited_by.id,
        invited_to_type: invited_to.class.name,
        invited_to_id: invited_to.id,
      )
    end

    context 'with a collection' do
      let(:invited_to) { create(:collection) }

      it 'renders the headers' do
        expect(mail.subject).to eq("Your invitation to \"#{invited_to.name}\" on Shape")
        expect(mail.to).to eq([user.email])
      end

      it 'renders the body' do
        expect(mail.body.encoded).to match("#{invited_by.name} has invited you to join \"#{invited_to.name}\"")
      end
    end

    context 'with a group' do
      let(:invited_to) { create(:group, organization: organization) }

      it 'renders the headers' do
        expect(mail.subject).to eq("Your invitation to \"#{invited_to.name}\" on Shape")
        expect(mail.to).to eq([user.email])
      end

      it 'renders the body' do
        expect(mail.body.encoded).to match(
          "#{invited_by.name} has invited you to join #{organization.name}'s \"#{invited_to.name}\" group",
        )
      end
    end
  end
end
