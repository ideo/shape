require 'rails_helper'

RSpec.describe DataReport, type: :service do
  let(:organization) { create(:organization_without_groups) }
  # parent needed for calculations that lookup org id
  let(:parent_collection) { create(:collection, organization: organization) }
  let(:data_item) { create(:data_item, parent_collection: parent_collection) }
  let(:report) { DataReport.new(data_item) }

  describe '#call' do
    context 'filtering by organization' do
      context 'with a participant measure' do
        let!(:activities) do
          # this will generate a new actor for each activity
          create_list(:activity, 3, organization: organization, action: :created)
        end

        before do
          data_item.update(
            data_settings: {
              d_measure: 'participants',
            },
          )
        end

        it 'should calculate the number of participants in the organization' do
          expect(report.call[:value]).to eq 3
        end
      end

      context 'with a viewer measure' do
        before do
          # this will generate a new actor for each activity
          create_list(:activity, 2, organization: organization, action: :viewed)
          data_item.update(
            data_settings: {
              d_measure: 'viewers',
            },
          )
        end

        it 'should calculate the number of viewers in the organization' do
          expect(report.call[:value]).to eq 2
        end
      end
    end

    context 'filtering by collection' do
      let(:other_collection) { create(:collection, organization: organization) }
      let(:parent_collection) { create(:collection, organization: organization) }
      let(:child_collection) { create(:collection, organization: organization, parent_collection: parent_collection) }
      let(:child_child_collection) { create(:collection, organization: organization, parent_collection: child_collection) }
      let(:item) { create(:question_item, parent_collection: child_child_collection) }
      let(:actor) { create(:user) }

      before do
        create_list(:activity, 1, target: parent_collection, action: :created, created_at: 2.months.ago)
        create_list(:activity, 5, target: parent_collection, action: :viewed, created_at: 2.months.ago)
        # same actor did this activity twice
        create_list(:activity, 2, target: child_collection, action: :edited, actor: actor)
        create_list(:activity, 4, target: child_collection, action: :viewed)
        create_list(:activity, 3, target: child_child_collection, action: :edited)
        create_list(:activity, 3, target: child_child_collection, action: :viewed)
        create_list(:activity, 4, target: item, action: :replaced)
        create_list(:activity, 2, target: item, action: :viewed)
        # other collection exists in the same org but outside the parent tree
        create_list(:activity, 5, target: other_collection, action: :created)
        create_list(:activity, 1, target: other_collection, action: :viewed)
      end

      context 'with a participant measure' do
        it 'calculates the number of participants in the collection, child collections, and items in those collections' do
          data_item.update(
            data_settings: {
              d_measure: 'participants',
              d_filters: [{ type: 'Collection', target: parent_collection.id }],
            },
          )
          expect(report.call[:value]).to eq 9
        end

        it 'calculates the number of participants in a child collection, and the items in that collection' do
          data_item.update(
            data_settings: {
              d_measure: 'participants',
              d_filters: [{ type: 'Collection', target: child_collection.id }],
            },
          )
          expect(report.call[:value]).to eq 8
        end

        it 'calculates the number of participants in a child child collection, and the items in that collection' do
          data_item.update(
            data_settings: {
              d_measure: 'participants',
              d_filters: [{ type: 'Collection', target: child_child_collection.id }],
            },
          )
          expect(report.call[:value]).to eq 7
        end
      end

      context 'with a viewers measure' do
        it 'calculates the number of viewers in the collection, child collections, and items in those collections' do
          data_item.update(
            data_settings: {
              d_measure: 'viewers',
              d_filters: [{ type: 'Collection', target: parent_collection.id }],
            },
          )
          expect(report.call[:value]).to eq 14
        end

        it 'calculates the number of viewers in a child collection, and the items in that collection' do
          data_item.update(
            data_settings: {
              d_measure: 'viewers',
              d_filters: [{ type: 'Collection', target: child_collection.id }],
            },
          )
          expect(report.call[:value]).to eq 9
        end

        it 'calculates the number of viewers in a child child collection, and the items in that collection' do
          data_item.update(
            data_settings: {
              d_measure: 'viewers',
              d_filters: [{ type: 'Collection', target: child_child_collection.id }],
            },
          )
          expect(report.call[:value]).to eq 5
        end
      end

      context 'with a participant measure and a timeframe' do
        it 'calculates the number of participants in the collection, child collections, and items in those collections' do
          data_item.update(
            data_settings: {
              d_measure: 'participants',
              d_timeframe: 'month',
              d_filters: [{ type: 'Collection', target: parent_collection.id }],
            },
          )
          values = report.call[:values]
          # we created one activity in the first month
          expect(values.first[:amount]).to eq 1
          # the rest are more recent
          expect(values.last[:amount]).to eq 8
        end
      end

      context 'with a viewer measure and a timeframe' do
        it 'calculates the number of viewers in the collection, child collections, and items in those collections' do
          data_item.update(
            data_settings: {
              d_measure: 'viewers',
              d_timeframe: 'month',
              d_filters: [{ type: 'Collection', target: parent_collection.id }],
            },
          )
          values = report.call[:values]
          # we created one activity in the first month
          expect(values.first[:amount]).to eq 5
          # the rest are more recent
          expect(values.last[:amount]).to eq 9
        end
      end
    end
  end
end
