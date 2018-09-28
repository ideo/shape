require 'rails_helper'

describe NetworkOrganizationUserSyncWorker do
  subject { NetworkOrganizationUserSyncWorker.new }
  let(:organization) { create(:organization) }
  let(:user) { create(:user) }

  describe '#perform' do
    let(:network_org_id) { rand(10_000) }
    let(:network_role_id) { rand(10_000) }
    let(:network_users_role_id) { rand(10_000) }

    before do
      allow(
        NetworkApi::Organization,
      ).to receive(:find_by_external_id).and_return(
        NetworkApi::Organization.new(
          id: network_org_id,
        ),
      )
      allow(
        NetworkApi::Role,
      ).to receive(:find_or_create_by_organization).and_return(
        NetworkApi::Role.new(
          id: network_role_id,
        ),
      )
      allow(
        NetworkApi::Role,
      ).to receive(:find_by_organization).and_return(
        NetworkApi::Role.new(
          id: network_role_id,
        ),
      )
      allow(
        NetworkApi::UsersRole,
      ).to receive(:create_by_uid).and_return(
        NetworkApi::UsersRole.new(
          id: network_users_role_id,
        ),
      )
      allow(
        NetworkApi::UsersRole,
      ).to receive(:remove_by_uid).and_return(
        true,
      )
    end

    context 'adding role' do
      it 'loads Network Organization' do
        expect(
          NetworkApi::Organization,
        ).to receive(:find_by_external_id).with(organization.id)
        subject.perform(user.uid, organization.id, :admin, :add)
      end

      it 'finds or creates Network Role' do
        expect(
          NetworkApi::Role,
        ).to receive(:find_or_create_by_organization).with(network_org_id, :admin)
        subject.perform(user.uid, organization.id, :admin, :add)
      end

      it 'creates Network UsersRole' do
        expect(
          NetworkApi::UsersRole,
        ).to receive(:create_by_uid).with(
          user_uid: user.uid,
          role_id: network_role_id,
        )
        subject.perform(user.uid, organization.id, :admin, :add)
      end
    end

    context 'removing role' do
      before do
        # Make sure worker functions without user
        user.destroy
      end

      it 'loads Network Organization' do
        expect(
          NetworkApi::Organization,
        ).to receive(:find_by_external_id).with(organization.id)
        subject.perform(user.uid, organization.id, :admin, :remove)
      end

      it 'finds Network Role' do
        expect(
          NetworkApi::Role,
        ).to receive(:find_by_organization).with(network_org_id, :admin)
        subject.perform(user.uid, organization.id, :admin, :remove)
      end

      it 'removes Network UsersRole' do
        expect(
          NetworkApi::UsersRole,
        ).to receive(:remove_by_uid).with(
          user_uid: user.uid,
          role_id: network_role_id,
        )
        subject.perform(user.uid, organization.id, :admin, :remove)
      end
    end
  end
end
