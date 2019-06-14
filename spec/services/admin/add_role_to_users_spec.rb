require 'rails_helper'

RSpec.describe Admin::AddRoleToUsers, type: :service do
  let(:invited_by) { create(:user) }
  let(:users) { create_list(:user, 3) }
  let(:send_invites) { true }
  let(:service) do
    Admin::AddRoleToUsers.new(
      invited_by: invited_by,
      users: users,
      send_invites: send_invites,
    )
  end

  let(:deliver_double) do
    double('InvitationMailer')
  end

  before :all do
    Sidekiq::Testing.inline!
  end

  after :all do
    Sidekiq::Testing.fake!
  end

  before do
    network_mailing_list_doubles
    Sidekiq::Worker.clear_all
    allow(InvitationMailer).to receive(:invite).and_return(deliver_double)
    allow(deliver_double).to receive(:deliver_later).and_return(true)
  end

  describe '#call' do
    it 'returns true if assigns role to all users' do
      expect(service.call).to be(true)
    end

    it 'assigns role to users' do
      service.call
      expect(users.all? { |user| user.has_role?(Role::SHAPE_ADMIN) }).to be true
    end

    it 'should queue up invitation for invited user' do
      expect(InvitationMailer).to receive(:invite).with(
        user_id: users.first.id,
        invited_by_id: invited_by.id,
        invited_to_type: Role::SHAPE_ADMIN.to_s.titleize
      )
      service.call
    end

    context 'with notifications turned off by the inviter' do
      let(:send_invites) { false }

      it 'should not send an email or notifications' do
        expect(InvitationMailer).not_to receive(:invite)
        service.call
      end
    end

    context 'with a user who has turned off notifications' do
      let!(:user) { create(:user) }
      let!(:users) { [user] }

      before do
        user.update(notify_through_email: false)
      end

      it 'should not send an email' do
        expect(InvitationMailer).not_to receive(:invite)
        service.call
      end
    end
  end
end
