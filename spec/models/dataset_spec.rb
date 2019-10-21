require 'rails_helper'

RSpec.describe Dataset, type: :model do
  describe '#viewable_by_user' do
    let(:organization) { create(:organization) }
    let!(:user) { create(:user, add_to_org: organization) }
    let!(:group) { create(:group, organization: organization) }
    let!(:group_2) { create(:group, organization: organization) }
    let!(:dataset_anyone_can_view) do
      create(:dataset, :with_cached_data, organization: organization)
    end
    let!(:dataset_group_permissions) do
      create(:dataset, :with_cached_data, anyone_can_view: false, organization: organization)
    end
    let!(:dataset_user_permissions) do
      create(:dataset, :with_cached_data, anyone_can_view: false, organization: organization)
    end
    let!(:dataset_not_visible) do
      create(:dataset, :with_cached_data, anyone_can_view: false, organization: organization)
    end
    before do
      user.add_role(Role::MEMBER, group)
      group.add_role(Role::VIEWER, dataset_group_permissions)
      group.add_role(Role::VIEWER, dataset_user_permissions)
      group_2.add_role(Role::VIEWER, dataset_not_visible)
    end

    it 'returns all datasets user has access to' do
      expect(Dataset.viewable_by_user(user)).to match_array(
        [dataset_anyone_can_view, dataset_group_permissions, dataset_user_permissions],
      )
    end
  end
end
