require 'rails_helper'

describe Api::V1::SearchController, type: :request, auth: true, search: true do
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
      sleep 0.5 if ENV['CODESHIP']
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
