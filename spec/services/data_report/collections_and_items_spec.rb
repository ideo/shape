require 'rails_helper'

RSpec.describe DataReport::CollectionsAndItems, type: :service do
  let(:users) { create_list(:user, 2) }
  let(:organization) { create(:organization_without_groups) }
  let(:parent) { create(:collection, organization: organization) }
  let!(:collection) { create(:collection, parent_collection: parent, num_cards: 1) }
  let(:items) { collection.items }
  let!(:activities) do
    create(:activity, action: Activity.actions[:created], actor: users[0], target: collection, organization: organization)
    create(:activity, action: Activity.actions[:commented], actor: users[1], target: items[0], organization: organization)
  end
  let(:data_source) { collection }
  let(:dataset) { create(:collections_and_items_dataset, data_source: data_source) }
  before do
    collection.recalculate_breadcrumb!
    collection.items.first.recalculate_breadcrumb!
  end

  describe '#call' do
    let(:call) do
      DataReport::CollectionsAndItems.call(dataset: dataset)
    end

    it 'returns time series' do
      expect(call).to eq(
        [
          {
            date: Time.now.utc.strftime('%Y-%m-%d'),
            value: 2,
          },
        ],
      )
    end
  end

  describe '#single_value' do
    let(:single_value) do
      DataReport::CollectionsAndItems.new(dataset: dataset).single_value
    end

    it 'returns time series' do
      expect(single_value).to eq(2)
    end
  end

  describe '#actor_ids' do
    let(:actor_ids) do
      DataReport::CollectionsAndItems.new(dataset: dataset).actor_ids
    end

    it 'returns actor_ids for all collections and items' do
      expect(actor_ids).to match_array(users.map(&:id))
    end
  end
end
