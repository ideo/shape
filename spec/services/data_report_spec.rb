require 'rails_helper'

RSpec.describe DataReport, type: :service do
  let(:organization) { create(:organization_without_groups) }
  # parent needed for calculations that lookup org id
  let(:parent_collection) { create(:collection, organization: organization) }
  let(:item) { create(:data_item, parent_collection: parent_collection) }
  let(:report) { DataReport.new(item) }
  # equivalent to item#data method here, but wanted to make it explicit
  let(:data) { report.call }

  describe '#call' do
    context 'with a participant measure' do
      let!(:activities) do
        # this will generate a new actor for each activity
        create_list(:activity, 3, organization: organization, action: :created)
      end

      before do
        item.update(
          data_settings: {
            d_measure: 'participants',
          },
        )
      end

      it 'should calculate the number of participants in the organization' do
        expect(data[:value]).to eq 3
      end
    end
  end
end
