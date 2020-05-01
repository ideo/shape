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
  # to make test more predictable, fix the dates to end of current month
  let(:end_date) { Time.current.next_month.beginning_of_month }
  let(:before_end_date) { end_date - 2.days }
  # will be in last month and also not "within last 30 days"
  let(:over_31_days_ago) { end_date - 33.days }

  let(:report_values) do
    report.call.map { |v| v[:value] }
  end

  let(:report) do
    DataReport::CollectionsAndItems.new(
      dataset: dataset,
      end_date: end_date,
    )
  end

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
      # parent collection is older
      let(:parent_collection) { create(:collection, organization: organization, created_at: over_31_days_ago) }
      let(:child_collection) { create(:collection, organization: organization, parent_collection: parent_collection) }
      let(:child_child_collection) { create(:collection, organization: organization, parent_collection: child_collection) }
      let(:item) { create(:text_item, parent_collection: child_child_collection) }
      let(:actor) { create(:user) }

      before do
        date = over_31_days_ago
        create_list(:activity, 1, target: parent_collection, action: :created, created_at: date, organization: organization)
        create_list(:activity, 5, target: parent_collection, action: :viewed, created_at: date, organization: organization)

        date = before_end_date
        # same actor edited twice
        create_list(:activity, 2, target: child_collection, action: :edited, created_at: date, actor: actor, organization: organization)
        # same actor viewed three times
        create_list(:activity, 3, target: child_collection, action: :viewed, created_at: date, actor: actor, organization: organization)
        create_list(:activity, 4, target: child_collection, action: :viewed, created_at: date, organization: organization)
        create_list(:activity, 3, target: child_child_collection, action: :edited, created_at: date, organization: organization)
        create_list(:activity, 3, target: child_child_collection, action: :viewed, created_at: date, organization: organization)
        create_list(:activity, 4, target: item, action: :replaced, created_at: date, organization: organization)
        create_list(:activity, 2, target: item, action: :viewed, created_at: date, organization: organization)
        # other collection exists in the same org but outside the parent tree
        create_list(:activity, 5, target: other_collection, action: :created, created_at: date, organization: organization)
        create_list(:activity, 1, target: other_collection, action: :viewed, created_at: date, organization: organization)
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

      context 'calculating viewers' do
        let(:dataset_params) do
          {
            data_source: parent_collection,
            measure: 'viewers',
          }
        end
        before do
        end

        it 'calculates the number of viewers in the collection, child collections, and items in those collections' do
          expect(report.single_value).to eq 15
        end

        context 'with child data source' do
          let(:dataset_params) do
            {
              data_source: child_collection,
              measure: 'viewers',
            }
          end

          it 'calculates the number of viewers in a child collection, and the items in that collection' do
            expect(report.single_value).to eq 10
          end
        end

        context 'with views measure' do
          let(:dataset_params) do
            {
              data_source: child_collection,
              measure: 'views',
            }
          end

          it 'calculates the number of views (not unique by actor)' do
            # should only count views of this exact collection (4 + 3 created above), not subcollections
            expect(child_collection.activities.where_viewed.count).to eq 7
            expect(report.single_value).to eq 7
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
          # will generate a 0 for the minimum (2 months back)
          # 1 activity in the first month, 8 more recent
          expect(report_values).to eq([0, 1, 8])

          # do a different query to double check our math
          actors = Activity
                   .where_participated
                   .where.not(target: other_collection)
                   .where('created_at >= ?', end_date - 1.month)
                   .group(:actor_id).count.count
          expect(actors).to eq 8
        end

        context 'with even older data, repeated actors' do
          before do
            date = over_31_days_ago - 1.month
            target = parent_collection
            create_list(:activity, 2, target: target, action: :created, actor: actor, created_at: date, organization: organization)
            create_list(:activity, 1, target: target, action: :created, created_at: date, organization: organization)
            date = before_end_date
            # same actor we've already counted for the current date
            create_list(:activity, 3, target: target, action: :created, actor: actor, created_at: date, organization: organization)
          end

          it 'calculates the number of participants in the collection, child collections, and items in those collections' do
            values = report.call
            # we have two unique actors in the oldest month
            expect(values[0][:value]).to eq 2
            expect(values[1][:value]).to eq 1
            expect(values[2][:value]).to eq 8
          end
        end

        context 'with a group filter' do
          # just to make sure it works properly, actor should include members of subgroups
          let!(:subgroup) { create(:group, organization: organization, add_members: [actor]) }
          let!(:group) { create(:group, add_subgroups: [subgroup]) }
          let!(:other_group) { create(:group) }

          context 'with a participant within the group' do
            before do
              dataset.update(
                groupings: [{ type: 'Group', id: group.id }],
              )
            end
            it 'should count the activities by the group participants' do
              # should always have at least back 3 dates, with just the 1 activity
              expect(report_values).to eq([0, 0, 1])
            end
          end

          context 'with no participants within the group' do
            before do
              dataset.update(
                groupings: [{ type: 'Group', id: other_group.id }],
              )
            end
            it 'should not return any activities' do
              expect(report_values).to eq [0, 0, 0]
            end
          end
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
          # 5 older activities, 10 more recent
          expect(report_values).to eq [0, 5, 10]
        end
      end

      context 'with a collections measure' do
        let!(:older_child_collections) do
          create_list(:collection, 2, organization: organization, parent_collection: parent_collection, created_at: over_31_days_ago)
        end
        let(:dataset_params) do
          {
            data_source: parent_collection,
            timeframe: 'month',
            measure: 'collections',
          }
        end

        it 'should calculate collection counts on a timeline' do
          # 2 old collections (+ parent itself = 3), 2 new
          expect(report_values).to eq [0, 3, 2]

          # just some math checking, we have 4 child collections (+ parent to total the 5 activities)
          expect(Collection.in_collection(parent_collection).count).to eq(4)
          # these should be the 2 recent ones
          expect(Collection.in_collection(parent_collection).where('created_at > ?', end_date - 1.month).count).to eq(2)
        end
      end

      context 'with an collections & items measure' do
        let!(:very_old_item) { create(:text_item, parent_collection: parent_collection, created_at: end_date - 10.weeks) }
        let!(:old_child_collection) do
          create(:collection, organization: organization, parent_collection: parent_collection, created_at: over_31_days_ago)
        end
        let!(:new_items) { create_list(:text_item, 4, parent_collection: old_child_collection) }
        let!(:old_items) { create_list(:text_item, 5, parent_collection: old_child_collection, created_at: over_31_days_ago) }
        let(:dataset_params) do
          {
            data_source: parent_collection,
            timeframe: 'month',
            measure: 'records',
          }
        end

        it 'should calculate collection & item counts on a timeline' do
          # 1 very old item (+2 months)
          # --
          # parent collection (parent context) 1
          # Old collection: 1
          # Old items: 5
          # PREV MONTH = 7 total
          # --
          # Recent collections: 2, Child, ChildChild (parent context)
          # Recent Items: 1 (data item, top context) + 1 (parent context) + 4 new items
          # RECENT = 8 total
          expect(report_values).to eq [1, 7, 8]
        end
      end
    end
  end

  context 'with fixed dataset' do
    let(:users) { create_list(:user, 2) }
    let(:organization) { create(:organization_without_groups) }
    let(:parent) { create(:collection, organization: organization) }
    let!(:collection) { create(:collection, organization: organization, parent_collection: parent, num_cards: 1) }
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
        DataReport::CollectionsAndItems.call(dataset: dataset, end_date: end_date)
      end

      it 'returns time series' do
        values = call
        expect(values.last).to eq(
          date: end_date.utc.strftime('%Y-%m-%d'),
          value: 2,
        )
        expect(report_values).to eq([0, 0, 2])
      end
    end

    describe '#single_value' do
      let(:single_value) do
        DataReport::CollectionsAndItems.new(dataset: dataset).single_value
      end

      it 'returns single value' do
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
end
