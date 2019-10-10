require 'rails_helper'

RSpec.describe Item::LegendItem, type: :model do
  let(:legend_item) { create(:legend_item) }
  let!(:data_item) do
    create(
      :data_item,
      :report_type_record,
      legend_item: legend_item,
    )
  end

  describe '#datasets_viewable_by' do
    let(:organization) { create(:organization) }
    let!(:user) { create(:user, add_to_org: organization) }
    let!(:group) { create(:group, organization: organization) }
    let!(:group_2) { create(:group, organization: organization) }
    let!(:data_items_dataset_can_view) do
      create(:data_items_dataset, :cached_data, data_item: data_item)
    end
    let!(:data_items_dataset_cannot_view) do
      create(:data_items_dataset, :cached_data, data_item: data_item)
    end
    before do
      data_items_dataset_can_view.dataset.update(organization_id: organization)
      data_items_dataset_cannot_view.dataset.update(organization_id: organization)
      user.add_role(Role::MEMBER, group)
      group.add_role(Role::VIEWER, data_items_dataset_can_view.dataset)
      group_2.add_role(Role::VIEWER, data_items_dataset_cannot_view.dataset)
    end

    it 'returns all datasets user has access to' do
      expect(legend_item.datasets_viewable_by(user)).to match_array(
        [data_items_dataset_can_view],
      )
    end
  end
end
