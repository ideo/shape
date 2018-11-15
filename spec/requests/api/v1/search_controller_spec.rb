require 'rails_helper'

describe Api::V1::SearchController, type: :request, json: true, auth: true, search: true, create_org: true do
  describe '#GET #search' do
    let!(:current_user) { @user }
    let!(:organization) { current_user.current_organization }
    let(:tag_list) { %w[blockchain prototype innovation] }
    let!(:collection_with_tags) do
      create(
        :collection,
        organization: organization,
        tag_list: tag_list,
        add_viewers: [current_user],
      )
    end
    let!(:collections) do
      create_list(
        :collection,
        3,
        organization: organization,
        add_editors: [current_user],
      )
    end
    let!(:collection_with_text) do
      create(
        :collection,
        organization: organization,
        num_cards: 2,
        add_viewers: [current_user],
      )
    end
    let(:path) { '/api/v1/search' }
    let(:find_collection) { collections.first }

    before do
      expect(current_user.has_role?(Role::MEMBER, organization.primary_group))
      Collection.reindex
      Collection.searchkick_index.refresh
      # Let ElasticSearch indexing finish (even though it seems to be synchronous)
      ENV['CODESHIP'] ? sleep(0.5) : sleep(0.1)
    end

    context 'if user can view collection' do
      it 'returns a 200' do
        get(path, params: { query: '' })
        expect(response.status).to eq(200)
      end

      it 'returns metadata' do
        get(path, params: { query: find_collection.name })
        expect(json['meta']['page']).to eq(1)
        expect(json['meta']['size']).to eq(1)
        expect(json['meta']['total']).to eq(1)
      end

      it 'returns collection that matches name search' do
        get(path, params: { query: find_collection.name })
        expect(json['data'].size).to eq(1)
        expect(json['data'].first['id'].to_i).to eq(find_collection.id)
      end

      it 'returns collection that matches sub-item text search' do
        Collection.reindex # just re-index again because this test sometimes fails
        text = collection_with_text.collection_cards.first.item.plain_content
        get(path, params: { query: text })
        expect(json['data'].size).to eq(1)
        expect(json['data'].first['id'].to_i).to eq(collection_with_text.id)
      end

      it 'returns collection that matches tag search' do
        get(path, params: { query: tag_list.first })
        expect(json['data'].size).to eq(1)
        expect(json['data'].first['id'].to_i).to eq(collection_with_tags.id)
      end

      it 'returns empty array if no match' do
        get(path, params: { query: 'bananas' })
        expect(json['data']).to be_empty
      end

      it 'returns the collection when hashtags are in the query' do
        get(path, params: { query: '#blockchain' })
        expect(json['data'].size).to eq(1)
        expect(json['data'].first['id'].to_i).to eq(collection_with_tags.id)
      end

      context 'with a per_page param set' do
        let!(:collections) do
          create_list(
            :collection,
            4,
            name: 'shared name',
            organization: organization,
            add_editors: [current_user],
          )
        end

        it 'returns only the amount for the page' do
          get(path, params: { query: 'shared name', per_page: 2 })
          expect(json['data'].size).to eq(2)
          expect(json['meta']['page']).to eq(1)
          expect(json['links']['last']).to eq(2)
        end
      end

      context 'searching by collection activity date' do
        let!(:collection_with_activity_in_range1) do
          collection = create(:collection, name: 'foo', organization: organization, add_viewers: [current_user])
          activity = collection.activities.create!(actor: current_user, organization: organization)
          activity.update_column(:updated_at, 2.day.ago)
          collection
        end
        let!(:collection_with_activity_in_range2) do
          collection = create(:collection, name: 'bar', organization: organization, add_viewers: [current_user])
          activity = collection.activities.create!(actor: current_user, organization: organization)
          activity.update_column(:updated_at, 2.days.from_now)
          collection
        end
        let!(:collection_with_activity_out_of_range1) do
          collection = create(:collection, name: 'baz', organization: organization, add_viewers: [current_user])
          activity = collection.activities.create!(actor: current_user, organization: organization)
          activity.update_column(:updated_at, 1.week.ago)
          collection
        end
        let!(:collection_with_activity_out_of_range2) do
          collection = create(:collection, name: 'qux', organization: organization, add_viewers: [current_user])
          activity = collection.activities.create!(actor: current_user, organization: organization)
          activity.update_column(:updated_at, 1.week.from_now)
          collection
        end
        let!(:collection_with_no_activity) do
          create(:collection, name: 'quxx', organization: organization, add_viewers: [current_user])
        end

        before do
          Collection.reindex
          Collection.searchkick_index.refresh
        end

        context 'updated within date range' do
          it 'includes collections with activity in the date range' do
            query = "Updated(#{3.days.ago.strftime('%d/%m/%Y')}, #{3.days.from_now.strftime('%d/%m/%Y')})"

            get(path, params: { query: query })
            expect(json['data']).to include(an_object_satisfying { |x| x['id'] == collection_with_activity_in_range1.id.to_s })
            expect(json['data']).to include(an_object_satisfying { |x| x['id'] == collection_with_activity_in_range2.id.to_s })
            expect(json['data']).not_to include(an_object_satisfying { |x| x['id'] == collection_with_activity_out_of_range1.id.to_s })
            expect(json['data']).not_to include(an_object_satisfying { |x| x['id'] == collection_with_activity_out_of_range2.id.to_s })
            expect(json['meta']['size']).to eq(2)
          end

          it 'works with search terms' do
            query = "foo Updated(#{3.days.ago.strftime('%d/%m/%Y')}, #{3.days.from_now.strftime('%d/%m/%Y')})"
            get(path, params: { query: query })
            expect(json['data']).to include(an_object_satisfying { |x| x['id'] == collection_with_activity_in_range1.id.to_s })
            expect(json['meta']['size']).to eq(1)
          end
        end

        context 'not updated within date range' do
          it 'includes collections with activity outside of the date range' do
            query = "NotUpdated(#{3.days.ago.strftime('%d/%m/%Y')}, #{3.days.from_now.strftime('%d/%m/%Y')})"
            get(path, params: { query: query })
            expect(json['data']).not_to include(an_object_satisfying { |x| x['id'] == collection_with_activity_in_range1.id.to_s })
            expect(json['data']).not_to include(an_object_satisfying { |x| x['id'] == collection_with_activity_in_range2.id.to_s })
            expect(json['data']).to include(an_object_satisfying { |x| x['id'] == collection_with_activity_out_of_range1.id.to_s })
            expect(json['data']).to include(an_object_satisfying { |x| x['id'] == collection_with_activity_out_of_range2.id.to_s })
            expect(json['data']).to include(an_object_satisfying { |x| x['id'] == collection_with_no_activity.id.to_s })
          end
        end
      end

      context 'when searching within a collection' do
        let!(:parent_collection) do
          create(:collection,
                 add_editors: [current_user],
                 organization: organization)
        end
        let!(:collections) do
          create_list(
            :collection,
            3,
            name: 'shared name',
            organization: organization,
            add_editors: [current_user],
            parent_collection: parent_collection,
          )
        end
        let!(:other_collection) do
          create(:collection,
                 name: 'other collection',
                 parent_collection: parent_collection,
                 add_editors: [current_user],
                 organization: organization)
        end
        let!(:orphan_collection) do
          create(
            :collection,
            name: 'shared name',
            organization: organization,
            add_editors: [current_user],
          )
        end

        before do
          Collection.reindex
          Collection.searchkick_index.refresh
        end

        it 'should return all collections with no actual query' do
          get(path, params: { query: "Within(#{parent_collection.id})" })
          expect(json['data'].size).to eq(4)
        end

        it 'should return collections within the collection that match the name' do
          get(path, params: { query: "Within(#{parent_collection.id}) shared" })
          expect(json['data'].size).to eq(3)
        end
      end
    end

    context 'if user cannot view collection' do
      before do
        current_user.remove_role(Role::EDITOR, find_collection)
        Collection.reindex
      end

      it 'returns empty array' do
        get(path, params: { query: find_collection.name })
        expect(json['data']).to be_empty
      end
    end

    context 'as a read-only viewer of the collection' do
      before do
        current_user.remove_role(Role::EDITOR, find_collection)
        current_user.add_role(Role::VIEWER, find_collection)
        Collection.reindex
      end

      it 'returns collection that matches name search' do
        get(path, params: { query: find_collection.name })
        expect(json['data'].size).to be(1)
        expect(json['data'].first['id'].to_i).to eq(find_collection.id)
      end
    end

    context 'with another org' do
      let!(:org2) { create(:organization) }
      let!(:org2_collection) do
        create(:collection, name: find_collection.name, organization: org2)
      end

      before do
        Collection.reindex
      end

      it 'does not return collection that has same name in another org' do
        get(path, params: { query: find_collection.name })
        expect(json['data'].size).to be(1)
        expect(json['data'].first['id'].to_i).to eq(find_collection.id)
      end
    end
  end
end
