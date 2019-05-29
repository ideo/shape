require 'rails_helper'

RSpec.describe DataReport::CollectionsAndItems, type: :service do
  let(:organization) { create(:organization_without_groups) }
  # parent needed for calculations that lookup org id
  let(:parent_collection) { create(:collection, organization: organization) }
  let(:data_item) do
    create(:data_item,
           :report_type_collections_and_items,
           parent_collection: parent_collection)
  end
  let(:dataset_measure) { 'participants' }
  let(:dataset_timeframe) { 'ever' }
  let(:dataset_data_source) { nil }
  let(:default_dataset_params) do
    {
      measure: 'participants',
      timeframe: 'ever',
      data_source: nil,
    }
  end
  let(:dataset_params) { {} }
  let(:dataset) do
    d = data_item.datasets.first
    d.update(default_dataset_params.merge(dataset_params))
    if d.type
      d.becomes(d.type.safe_constantize)
    else
      d
    end
  end

  let(:report) { DataReport::CollectionsAndItems.new(dataset: dataset) }

  describe '#call' do
    context 'filtering by organization' do
      before do
        dataset.update(
          organization: organization,
          groupings: [{ type: 'Organization', id: organization.id }],
        )
      end

      context 'with a participant measure' do
        let!(:activities) do
          # this will generate a new actor for each activity
          create_list(:activity, 3, organization: organization, action: :created)
        end

        it 'should calculate the number of participants in the organization' do
          expect(report.single_value).to eq 3
        end
      end

      context 'with a viewer measure' do
        let(:dataset_params) { { measure: 'viewers' } }

        before do
          # this will generate a new actor for each activity
          create_list(:activity, 2, organization: organization, action: :viewed)
        end

        it 'should calculate the number of viewers in the organization' do
          expect(report.single_value).to eq 2
        end
      end

      context 'with an activity measure' do
        let(:actor) { create(:user) }
        let(:dataset_params) { { measure: 'activity' } }

        before do
          # viewed does not count towards activity
          create_list(:activity, 2, actor: actor, organization: organization, action: :viewed)
          # commented does
          create_list(:activity, 3, actor: actor, organization: organization, action: :commented)
        end

        it 'should calculate the number of activities in the organization' do
          # 3 comments should count, even if they are the same actor
          expect(report.single_value).to eq 3
        end
      end

      context 'with a content, collections measure' do
        let!(:collections) { create_list(:collection, 3, organization: organization) }
        let(:dataset_params) { { measure: 'collections' } }

        it 'should calculate the number of collections total in the org' do
          # NOTE: an extra collection is created in the initial setup
          expect(report.single_value).to eq 4
          expect(report.single_value).to eq Collection.where(organization_id: organization.id).count
        end
      end

      context 'with a content, items measure' do
        let(:collection) { create(:collection, organization: organization) }
        let!(:items) { create_list(:text_item, 5, parent_collection: collection) }
        let(:dataset_params) { { measure: 'items' } }

        it 'should calculate the number of items total in the org' do
          # NOTE: an extra item to account for the actual data item
          expect(report.single_value).to eq 6
          expect(report.single_value).to eq Item.count
        end
      end

      context 'with a content, items and collections measure' do
        let!(:collection) { create(:collection, organization: organization) }
        let!(:items) { create_list(:text_item, 5, parent_collection: collection) }
        let(:dataset_params) { { measure: 'records' } }

        it 'should calculate the number of items & collections total in the org' do
          # NOTE: an extra item to account for the actual data item
          # 6 items total, plus two collections
          expect(report.single_value).to eq 8
        end
      end
    end

    context 'filtering by collection' do
      # DEFAULT SHARED SETUP for all below specs:
      # Parent collection -> child collection -> child_child_collection -> 1 item

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
        let(:dataset_params) { { data_source: parent_collection } }

        it 'calculates the number of participants in the collection, child collections, and items in those collections' do
          expect(report.single_value).to eq 9
        end

        context 'with a child collection data source' do
          let(:dataset_params) { { data_source: child_collection } }

          it 'calculates the number of participants in a child collection, and the items in that collection' do
            expect(report.single_value).to eq 8
          end
        end

        context 'with a child child collection data source' do
          let(:dataset_params) { { data_source: child_child_collection } }

          it 'calculates the number of participants in a child child collection, and the items in that collection' do
            expect(report.single_value).to eq 7
          end
        end
      end

      context 'with a viewers measure' do
        let(:dataset_params) do
          {
            data_source: parent_collection,
            measure: 'viewers',
          }
        end

        it 'calculates the number of viewers in the collection, child collections, and items in those collections' do
          expect(report.single_value).to eq 14
        end

        context 'with child data source' do
          let(:dataset_params) do
            {
              data_source: child_collection,
              measure: 'viewers',
            }
          end

          it 'calculates the number of viewers in a child collection, and the items in that collection' do
            expect(report.single_value).to eq 9
          end
        end

        context 'with child child data source' do
          let(:dataset_params) do
            {
              data_source: child_child_collection,
              measure: 'viewers',
            }
          end

          it 'calculates the number of viewers in a child child collection, and the items in that collection' do
            expect(report.single_value).to eq 5
          end
        end
      end

      context 'with a collections measure' do
        let!(:other_child_collection) { create(:collection, organization: organization, parent_collection: parent_collection) }
        let(:dataset_params) do
          {
            data_source: parent_collection,
            measure: 'collections',
          }
        end

        it 'should calculate the number of collections in the collection' do
          expect(report.single_value).to eq 4
        end
      end

      context 'with an items measure' do
        let!(:parent_items) { create_list(:text_item, 5, parent_collection: parent_collection) }
        let!(:child_items) { create_list(:text_item, 3, parent_collection: child_collection) }
        let!(:child_child_items) { create_list(:text_item, 2, parent_collection: child_child_collection) }
        let(:dataset_params) do
          {
            data_source: parent_collection,
            measure: 'items',
          }
        end

        it 'should calculate the number of items in the collection' do
          # NOTE: plus 1 question item + actual data item
          expect(report.single_value).to eq 12
        end
      end

      context 'with an collections & items measure' do
        let!(:other_child_collection) { create(:collection, organization: organization, parent_collection: parent_collection) }
        let!(:parent_items) { create_list(:text_item, 5, parent_collection: parent_collection) }
        let!(:child_items) { create_list(:text_item, 3, parent_collection: other_child_collection) }
        let!(:child_child_items) { create_list(:text_item, 2, parent_collection: child_child_collection) }
        let(:dataset_params) do
          {
            data_source: parent_collection,
            measure: 'records',
          }
        end

        it 'should calculate the number of collections & items in the collection' do
          # 4 colls + 12 items (see tests above)
          expect(report.single_value).to eq 16
        end
      end

      context 'with a participant measure and a timeframe' do
        let(:dataset_params) do
          {
            data_source: parent_collection,
            timeframe: 'month',
          }
        end

        it 'calculates the number of participants in the collection, child collections, and items in those collections' do
          values = report.call
          # we created one activity in the first month
          expect(values.first[:value]).to eq 1
          # the rest are more recent
          expect(values.last[:value]).to eq 8
        end
      end

      context 'with a viewer measure and a timeframe' do
        let(:dataset_params) do
          {
            data_source: parent_collection,
            timeframe: 'month',
            measure: 'viewers',
          }
        end

        it 'calculates the number of viewers in the collection, child collections, and items in those collections' do
          values = report.call
          # we created one activity in the first month
          expect(values.first[:value]).to eq 5
          # the rest are more recent
          expect(values.last[:value]).to eq 9
        end
      end

      context 'with a collections measure' do
        let!(:other_child_collection) do
          create(:collection, organization: organization, parent_collection: parent_collection, created_at: 2.months.ago)
        end
        let(:dataset_params) do
          {
            data_source: parent_collection,
            timeframe: 'month',
            measure: 'collections',
          }
        end

        it 'should calculate collection counts on a timeline' do
          values = report.call
          expect(values.first[:value]).to eq 1
          # the rest are more recent
          expect(values.last[:value]).to eq 3
        end
      end

      context 'with an collections & items measure' do
        let!(:old_child_collection) do
          create(:collection, organization: organization, parent_collection: parent_collection, created_at: 2.months.ago)
        end
        let!(:new_items) { create_list(:text_item, 3, parent_collection: old_child_collection) }
        let!(:old_items) { create_list(:text_item, 5, parent_collection: old_child_collection, created_at: 2.months.ago) }
        let(:dataset_params) do
          {
            data_source: parent_collection,
            timeframe: 'month',
            measure: 'records',
          }
        end

        it 'should calculate collection & item counts on a timeline' do
          # Old collection: 1
          # Old items: 5
          # OLD = 6 total
          # Recent collections: 3, Parent, Child, ChildChild (parent context)
          # Recent Items: 1 (data item, top context) + 1 (parent context) + 3 new items
          # RECENT = 8 total
          values = report.call
          expect(values.first[:value]).to eq 6
          expect(values.last[:value]).to eq 8
        end
      end
    end
  end
end
