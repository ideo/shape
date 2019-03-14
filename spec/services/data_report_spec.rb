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
  let(:report) { DataReport::CollectionsAndItems.new(data_item) }
  let(:dataset) { report.call.first }

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
          expect(dataset[:single_value]).to eq 3
        end

        context 'with return_records: true' do
          let!(:report) do
            DataReport::CollectionsAndItems.new(
              data_item,
              return_records: true,
            )
          end

          it 'should return the actor_ids instead of the count' do
            expect(
              dataset[:single_value].pluck(:actor_id),
            ).to match_array(
              activities.pluck(:actor_id),
            )
          end
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
          expect(dataset[:single_value]).to eq 2
        end
      end

      context 'with an activity measure' do
        let(:actor) { create(:user) }
        before do
          # viewed does not count towards activity
          create_list(:activity, 2, actor: actor, organization: organization, action: :viewed)
          # commented does
          create_list(:activity, 3, actor: actor, organization: organization, action: :commented)
          data_item.update(
            data_settings: {
              d_measure: 'activity',
            },
          )
        end

        it 'should calculate the number of activities in the organization' do
          # 3 comments should count, even if they are the same actor
          expect(dataset[:single_value]).to eq 3
        end
      end

      context 'with a content, collections measure' do
        let!(:collections) { create_list(:collection, 3, organization: organization) }

        before do
          data_item.update(
            data_settings: {
              d_measure: 'collections',
            },
          )
        end

        it 'should calculate the number of collections total in the org' do
          # NOTE: an extra collection is created in the initial setup
          expect(dataset[:single_value]).to eq 4
          expect(dataset[:single_value]).to eq Collection.count
        end
      end

      context 'with a content, items measure' do
        let(:collection) { create(:collection, organization: organization) }
        let!(:items) { create_list(:text_item, 5, parent_collection: collection) }

        before do
          data_item.update(
            data_settings: {
              d_measure: 'items',
            },
          )
        end

        it 'should calculate the number of items total in the org' do
          # NOTE: an extra item to account for the actual data item
          expect(dataset[:single_value]).to eq 6
          expect(dataset[:single_value]).to eq Item.count
        end
      end

      context 'with a content, items and collections measure' do
        let(:collection) { create(:collection, organization: organization) }
        let!(:items) { create_list(:text_item, 5, parent_collection: collection) }

        before do
          data_item.update(
            data_settings: {
              d_measure: 'records',
            },
          )
        end

        it 'should calculate the number of items & collections total in the org' do
          # NOTE: an extra item to account for the actual data item
          # 6 items total, plus two collections
          expect(dataset[:single_value]).to eq 8
          expect(dataset[:single_value]).to eq(Item.count + Collection.count)
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
        it 'calculates the number of participants in the collection, child collections, and items in those collections' do
          data_item.update(
            data_settings: {
              d_measure: 'participants',
              d_filters: [{ type: 'Collection', target: parent_collection.id }],
            },
          )
          expect(dataset[:single_value]).to eq 9
        end

        it 'calculates the number of participants in a child collection, and the items in that collection' do
          data_item.update(
            data_settings: {
              d_measure: 'participants',
              d_filters: [{ type: 'Collection', target: child_collection.id }],
            },
          )
          expect(dataset[:value]).to eq 8
        end

        it 'calculates the number of participants in a child child collection, and the items in that collection' do
          data_item.update(
            data_settings: {
              d_measure: 'participants',
              d_filters: [{ type: 'Collection', target: child_child_collection.id }],
            },
          )
          expect(dataset[:single_value]).to eq 7
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
          expect(dataset[:single_value]).to eq 14
        end

        it 'calculates the number of viewers in a child collection, and the items in that collection' do
          data_item.update(
            data_settings: {
              d_measure: 'viewers',
              d_filters: [{ type: 'Collection', target: child_collection.id }],
            },
          )
          expect(dataset[:single_value]).to eq 9
        end

        it 'calculates the number of viewers in a child child collection, and the items in that collection' do
          data_item.update(
            data_settings: {
              d_measure: 'viewers',
              d_filters: [{ type: 'Collection', target: child_child_collection.id }],
            },
          )
          expect(dataset[:single_value]).to eq 5
        end
      end

      context 'with a collections measure' do
        let!(:other_child_collection) { create(:collection, organization: organization, parent_collection: parent_collection) }

        before do
          data_item.update(
            data_settings: {
              d_measure: 'collections',
              d_filters: [{ type: 'Collection', target: parent_collection.id }],
            },
          )
        end

        it 'should calculate the number of collections in the collection' do
          expect(dataset[:single_value]).to eq 4
        end
      end

      context 'with an items measure' do
        let!(:parent_items) { create_list(:text_item, 5, parent_collection: parent_collection) }
        let!(:child_items) { create_list(:text_item, 3, parent_collection: child_collection) }
        let!(:child_child_items) { create_list(:text_item, 2, parent_collection: child_child_collection) }

        before do
          data_item.update(
            data_settings: {
              d_measure: 'items',
              d_filters: [{ type: 'Collection', target: parent_collection.id }],
            },
          )
        end

        it 'should calculate the number of items in the collection' do
          # NOTE: plus 1 question item + actual data item
          expect(dataset[:single_value]).to eq 12
        end
      end

      context 'with an collections & items measure' do
        let!(:other_child_collection) { create(:collection, organization: organization, parent_collection: parent_collection) }
        let!(:parent_items) { create_list(:text_item, 5, parent_collection: parent_collection) }
        let!(:child_items) { create_list(:text_item, 3, parent_collection: other_child_collection) }
        let!(:child_child_items) { create_list(:text_item, 2, parent_collection: child_child_collection) }

        before do
          data_item.update(
            data_settings: {
              d_measure: 'records',
              d_filters: [{ type: 'Collection', target: parent_collection.id }],
            },
          )
        end

        it 'should calculate the number of collections & items in the collection' do
          # 4 colls + 12 items (see tests above)
          expect(dataset[:single_value]).to eq 16
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
          values = dataset[:data]
          # we created one activity in the first month
          expect(values.first[:value]).to eq 1
          # the rest are more recent
          expect(values.last[:value]).to eq 8
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
          values = dataset[:data]
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

        before do
          data_item.update(
            data_settings: {
              d_measure: 'collections',
              d_timeframe: 'month',
              d_filters: [{ type: 'Collection', target: parent_collection.id }],
            },
          )
        end

        it 'should calculate collection counts on a timeline' do
          values = dataset[:data]
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

        before do
          data_item.update(
            data_settings: {
              d_measure: 'records',
              d_timeframe: 'month',
              d_filters: [{ type: 'Collection', target: parent_collection.id }],
            },
          )
        end

        it 'should calculate collection & item counts on a timeline' do
          # Old collection: 1
          # Old items: 5
          # OLD = 6 total
          # Recent collections: 3, Parent, Child, ChildChild (parent context)
          # Recent Items: 1 (data item, top context) + 1 (parent context) + 3 new items
          # RECENT = 8 total
          values = dataset[:data]
          expect(values.first[:value]).to eq 6
          expect(values.last[:value]).to eq 8
        end
      end
    end
  end
end
