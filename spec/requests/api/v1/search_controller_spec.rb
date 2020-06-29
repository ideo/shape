require 'rails_helper'

def batch_reindex(klass)
  klass.search_import.find_in_batches do |batch|
    klass.searchkick_index.import(batch)
  end
  klass.searchkick_index.refresh
end

describe Api::V1::SearchController, type: :request, json: true, auth: true, search: true, create_org: true do
  describe 'GET #search' do
    let!(:current_user) { @user }
    let!(:organization) { current_user.current_organization }
    # check for case-sensitivity
    let(:tag_list) { %w[BLOCKchain prototype innovation-metrics] }
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
    let(:path) { "/api/v1/organizations/#{organization.slug}/search" }
    let(:find_collection) { collections.first }
    let!(:number_collection) do
      create(
        :collection,
        organization: organization,
        name: '3rd Place Results',
        add_viewers: [current_user],
      )
    end

    let(:first_result) do
      json['data'].first
    end
    let(:first_record_id) do
      first_result['relationships']['record']['data']['id'].to_i
    end
    let(:record_ids) do
      json['data'].map do |d|
        d['relationships']['record']['data']['id'].to_i
      end
    end

    before do
      Collection.reindex
      Collection.searchkick_index.refresh
      # Let ElasticSearch indexing finish (even though it seems to be synchronous)
      ENV['CODESHIP'] ? sleep(0.5) : sleep(0.1)
    end

    context 'if user can view collection' do
      it 'returns a 200' do
        get(path, params: { query: '' })
        expect(current_user.has_role?(Role::MEMBER, organization.primary_group))
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
        # this is how the card id is generated when there is no parent_collection_card
        expect(first_result['id']).to eq("result-#{find_collection.id}")
        expect(first_record_id).to eq(find_collection.id)
      end

      it 'returns collection that matches sub-item text search' do
        batch_reindex(Collection) # just re-index again because this test sometimes fails
        text = collection_with_text.collection_cards.first.item.plain_content
        get(path, params: { query: text })
        expect(json['data'].size).to eq(1)
        expect(first_record_id).to eq(collection_with_text.id)
      end

      it 'returns collection that matches tag search' do
        get(path, params: { query: tag_list.first })
        expect(json['data'].size).to eq(1)
        expect(first_record_id).to eq(collection_with_tags.id)
      end

      it 'returns empty array if no match' do
        get(path, params: { query: 'bananas' })
        expect(json['data']).to be_empty
      end

      it 'returns the collection when hashtags are in the query' do
        # casing shouldn't matter
        get(path, params: { query: '#blockChain' })
        expect(json['data'].size).to eq(1)
        expect(first_record_id).to eq(collection_with_tags.id)
        get(path, params: { query: '#prototype' })
        expect(json['data'].size).to eq(1)
        expect(first_record_id).to eq(collection_with_tags.id)
        get(path, params: { query: '#Innovation-Metrics' })
        expect(json['data'].size).to eq(1)
        expect(first_record_id).to eq(collection_with_tags.id)
      end

      context 'searching by ID' do
        it 'should find records by ID' do
          get(path, params: { query: find_collection.id })
          expect(json['data'].size).to eq(1)
          expect(first_record_id).to eq(find_collection.id)
        end

        it 'should find records by ID and slug' do
          get(path, params: { query: "#{find_collection.id}-any-slug-could-have-123-numbers" })
          expect(json['data'].size).to eq(1)
          expect(first_record_id).to eq(find_collection.id)
        end

        it 'should find records named with a number (not ID)' do
          get(path, params: { query: '3rd' })
          expect(first_record_id).to eq(number_collection.id)
        end
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
        before do
          batch_reindex(Collection)
        end

        it 'returns only the amount for the page' do
          get(path, params: { query: 'shared name', per_page: 2 })
          expect(json['data'].size).to eq(2)
          expect(json['meta']['page']).to eq(1)
          expect(json['meta']['total_pages']).to eq(2)
          expect(json['meta']['total']).to eq(4)
          expect(json['links']['last']).to eq(2)
        end
      end

      context 'with master_template param' do
        let!(:templates) do
          templates = create_list(
            :collection,
            2,
            organization: organization,
            master_template: true,
            add_viewers: [current_user],
          )
          test_collection = create(:collection, type: 'Collection::TestCollection')
          templates << test_collection
          templates
        end
        before do
          batch_reindex(Collection)
        end

        it 'only finds template collections and filters out non-standard collections' do
          get(path, params: { master_template: true })
          expect(json['data'].size).to eq(2)
          expect(record_ids).to match_array(
            templates.reject { |t| t.type == 'Collection::TestCollection' }.map(&:id),
          )
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
          batch_reindex(Collection)
        end

        context 'updated within date range' do
          it 'includes collections with activity in the date range' do
            query = "Updated(#{3.days.ago.strftime('%d/%m/%Y')}, #{3.days.from_now.strftime('%d/%m/%Y')})"

            get(path, params: { query: query })
            expect(record_ids).to include(collection_with_activity_in_range1.id)
            expect(record_ids).to include(collection_with_activity_in_range2.id)
            expect(record_ids).not_to include(collection_with_activity_out_of_range1.id)
            expect(record_ids).not_to include(collection_with_activity_out_of_range2.id)
            expect(json['meta']['size']).to eq(2)
          end

          it 'works with search terms' do
            query = "foo Updated(#{3.days.ago.strftime('%d/%m/%Y')}, #{3.days.from_now.strftime('%d/%m/%Y')})"
            get(path, params: { query: query })
            expect(record_ids).to include(collection_with_activity_in_range1.id)
            expect(json['meta']['size']).to eq(1)
          end
        end

        context 'not updated within date range' do
          it 'includes collections with activity outside of the date range' do
            query = "NotUpdated(#{3.days.ago.strftime('%d/%m/%Y')}, #{3.days.from_now.strftime('%d/%m/%Y')})"
            get(path, params: { query: query })
            expect(record_ids).not_to include(collection_with_activity_in_range1.id)
            expect(record_ids).not_to include(collection_with_activity_in_range2.id)
            expect(record_ids).to include(collection_with_activity_out_of_range1.id)
            expect(record_ids).to include(collection_with_activity_out_of_range2.id)
            expect(record_ids).to include(collection_with_no_activity.id)
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
          batch_reindex(Collection)
        end

        it 'should return all collections with no actual query' do
          get(path, params: { query: "within:#{parent_collection.id}" })
          expect(json['data'].size).to eq(4)
        end

        it 'should return collections within the collection that match the name' do
          get(path, params: { query: "within:#{parent_collection.id} shared" })
          expect(json['data'].size).to eq(3)
        end
      end
    end

    context 'when searching for test alias collections' do
      let(:test_collection) do
        create(
          :test_collection,
          :completed,
          :launched,
          organization: organization,
          add_editors: [current_user],
        )
      end
      let!(:test_audience) { create(:test_audience, test_collection: test_collection) }
      let!(:survey_response) do
        create(
          :survey_response,
          :fully_answered,
          test_collection: test_collection,
          test_audience: test_audience,
        )
      end
      let(:survey_response_alias_collection) { survey_response.test_results_collection }
      before do
        # create all content which will create the survey_response_alias_collection
        TestResultsCollection::CreateContent.call(
          test_results_collection: test_collection.test_results_collection,
          created_by: current_user,
        )
        survey_response.reload
        batch_reindex(Collection)
      end

      it 'returns the response that matches' do
        test_answer = survey_response_alias_collection.search_data[:test_answer].sample
        expect(test_answer).not_to be_nil
        get(path, params: { query: "test_answer(#{test_answer})" })
        expect(record_ids).to eq([survey_response_alias_collection.id])
      end
    end

    context 'when searching for archived' do
      let(:deleted_collection) do
        create(:collection,
               name: 'dinosaur',
               organization: organization,
               add_viewers: [current_user])
      end
      let(:alive_collection) do
        create(:collection,
               name: 'dinosaur',
               organization: organization,
               add_viewers: [current_user])
      end

      before do
        deleted_collection.archive!
        batch_reindex(Collection)
      end

      it 'should returned deleted objects only' do
        get(path, params: { query: 'dinosaur',  show_archived: true })
        expect(json['data'].size).to eq(1)
      end
    end

    context 'if user cannot view collection' do
      before do
        current_user.remove_role(Role::EDITOR, find_collection)
        batch_reindex(Collection)
      end

      it 'returns empty array' do
        get(path, params: { query: find_collection.name })
        expect(json['data']).to be_empty
      end
    end

    context 'with super_admin role' do
      before do
        current_user.remove_role(Role::EDITOR, find_collection)
        current_user.add_role(Role::SUPER_ADMIN)
        batch_reindex(Collection)
      end

      it 'has access to everything' do
        get(path, params: { query: find_collection.name })
        expect(json['data'].size).to eq(1)
      end
    end

    context 'if user can view collection via group-in-group' do
      let(:master_group) { create(:group, organization: organization) }
      let(:user_group) { create(:group, organization: organization) }
      before do
        current_user.remove_role(Role::EDITOR, find_collection)
        current_user.add_role(Role::EDITOR, user_group)
        user_group.add_role(Role::VIEWER, master_group)
        master_group.add_role(Role::VIEWER, find_collection)
        batch_reindex(Collection)
      end

      it 'returns collection' do
        get(path, params: { query: find_collection.name })
        expect(json['data'].size).to eq(1)
      end
    end

    context 'as a read-only viewer of the collection' do
      before do
        current_user.remove_role(Role::EDITOR, find_collection)
        current_user.add_role(Role::VIEWER, find_collection)
        batch_reindex(Collection)
      end

      it 'returns collection that matches name search' do
        get(path, params: { query: find_collection.name })
        expect(json['data'].size).to eq(1)
        expect(first_record_id).to eq(find_collection.id)
      end
    end

    context 'with another org' do
      let!(:org2) { create(:organization) }
      let!(:org2_collection) do
        create(:collection, name: find_collection.name, organization: org2)
      end

      before do
        batch_reindex(Collection)
      end

      it 'does not return collection that has same name in another org' do
        get(path, params: { query: find_collection.name })
        expect(json['data'].size).to be(1)
        expect(first_record_id).to eq(find_collection.id)
      end
    end

    context 'with type' do
      let!(:test_collection) do
        create(
          :test_collection,
          organization: organization,
          add_viewers: [current_user],
        )
      end

      before do
        batch_reindex(Collection)
      end

      it 'only returns collections of that type' do
        get(path, params: { type: 'Collection::TestCollection' })
        expect(json['data'].size).to equal(1)
        expect(first_record_id).to eq(test_collection.id)
      end
    end

    context 'with order_by and order_direction' do
      let!(:find_collection) { collections.first }
      before do
        find_collection.update(created_at: 1.year.from_now)
        batch_reindex(Collection)
      end

      it 'sorts according to given params (desc)' do
        get(path, params: { order_by: :created_at, order_direction: :desc })
        expect(first_record_id).to eq(find_collection.id)
      end

      it 'sorts according to given params (asc)' do
        get(path, params: { order_by: :created_at, order_direction: :asc })
        expect(first_record_id).not_to eq(find_collection.id)
      end
    end

    describe 'GET #search_collection_cards' do
      let!(:path) { "/api/v1/organizations/#{organization.id}/search_collection_cards" }
      # Parent card is necessary as that is what is returned
      let!(:parent_collection_card) { create(:collection_card, collection: find_collection) }
      before { batch_reindex(Collection) }

      it 'returns a 200' do
        get(path, params: { query: '' })
        expect(response.status).to eq(200)
      end

      it 'returns full serialized collection' do
        get(path, params: { query: find_collection.name })
        expect(
          json_included_objects_of_type('collections').first['attributes']['serializer'],
        ).to eq('SerializableCollection')
      end
    end
  end

  describe 'GET #search_users_and_groups' do
    let!(:current_user) { @user }
    let!(:organization) { current_user.current_organization }
    let!(:other_user) do
      # make sure name is something unique because @user has a random name which could otherwise match
      create(:user, add_to_org: organization, first_name: 'Veryunique', last_name: 'Lastname', email: 'abc123xyz@emailz.net')
    end
    let!(:similar_user) do
      create(:user, add_to_org: organization, first_name: @user.first_name)
    end
    let!(:subgroup) { create(:group, organization: organization) }
    let(:path) { '/api/v1/search/users_and_groups' }

    before do
      User.reindex
      Group.reindex
    end

    it 'should find users in the org by name' do
      get(path, params: { query: 'Veryunique' })
      expect(json['data'].size).to be(1)
      expect(json['data'].first['id'].to_i).to eq(other_user.id)
    end

    it 'should find users in the org by partial name match' do
      get(path, params: { query: 'Veryu' })
      expect(json['data'].size).to be(1)
      expect(json['data'].first['id'].to_i).to eq(other_user.id)
    end

    it 'should find users in the org by partial email match' do
      get(path, params: { query: 'abc123' })
      expect(json['data'].size).to be(1)
      expect(json['data'].first['id'].to_i).to eq(other_user.id)
    end

    it 'should find similar named users' do
      get(path, params: { query: @user.first_name })
      expect(json['data'].select { |d| d['type'] == 'users' }.count).to eq 2
    end

    it 'should find org groups' do
      # the org is named "first_name last_name organization"
      get(path, params: { query: @user.first_name })
      expect(json['data'].select { |d| d['type'] == 'groups' }.count).to eq 3
    end

    context 'with application bot user' do
      let!(:application) { create(:application, user: other_user) }

      it 'returns them in regular (typeahead) search' do
        get(path, params: { query: other_user.first_name })
        expect(json['data'].first['id'].to_i).to eq(other_user.id)
      end
    end

    context 'searching a collection' do
      let!(:collection) { create(:collection) }
      before do
        @user.add_role(Role::EDITOR, collection)
        similar_user.add_role(Role::EDITOR, collection)
      end
      let(:path_with_collection) do
        "#{path}?resource_id=#{collection.id}&resource_type=Collection"
      end
      let(:json_user_ids) do
        json['data']
          .first['relationships']['users']['data']
          .map { |json| json['id'].to_i }
      end

      it 'returns user with role' do
        get(path_with_collection, params: { query: @user.first_name })
        expect(json_user_ids).to match_array([@user.id, similar_user.id])
      end

      context 'with application bot user' do
        let!(:application) { create(:application, user: similar_user) }
        before { User.reindex }

        it 'does not return application user' do
          get(path_with_collection, params: { query: @user.first_name })
          expect(json_user_ids).to eq([@user.id])
        end
      end
    end

    context 'searching a group' do
      let!(:group) { create(:group, organization: organization, add_admins: [@user, similar_user, subgroup]) }

      let(:path_with_group) do
        "#{path}?resource_id=#{group.id}&resource_type=Group"
      end
      let(:json_user_ids) do
        json['data']
          .first['relationships']['users']['data']
          .map { |json| json['id'].to_i }
      end
      let(:json_group_ids) do
        json['data']
          .first['relationships']['groups']['data']
          .map { |json| json['id'].to_i }
      end

      it 'returns user with role' do
        get(path_with_group, params: { query: @user.first_name })
        expect(json_user_ids).to match_array([@user.id, similar_user.id])
      end

      it 'returns group with role' do
        get(path_with_group, params: { query: subgroup.name })
        expect(json_group_ids).to match_array([subgroup.id])
      end
    end
  end
end
