require 'rails_helper'

RSpec.describe OrganizationMembershipAndLinkingWorker, type: :worker do
  let!(:organization) { create(:organization) }
  let!(:users) { create_list(:user, 2) }
  let!(:user) { create(:user, add_to_org: organization) }
  let!(:users_to_add) { [user] }
  let(:groups_to_add) { create_list(:group, 1) }
  let!(:collection_to_link) { create(:collection, organization: organization) }
  let(:item_to_link) { nil }
  let(:existing_link) { nil }

  let(:perform) do
    OrganizationMembershipAndLinkingWorker.new.perform(
      users.map(&:id),
      organization.id,
      users_to_add.map(&:id),
      groups_to_add.map(&:id),
      [collection_to_link&.id].compact,
      [item_to_link&.id].compact,
    )
  end

  describe '#perform' do
    it 'calls OrganizationMembershipWorker and LinkToSharedCollectionsWorker' do
      expect(OrganizationMembershipWorker).to receive(:perform_sync).with(
        users.pluck(:id),
        collection_to_link.organization_id,
      )

      expect(LinkToSharedCollectionsWorker).to receive(:perform_sync).with(
        users_to_add.map(&:id),
        groups_to_add.map(&:id),
        [collection_to_link&.id].compact,
        [item_to_link&.id].compact,
      )

      perform
    end
  end
end
