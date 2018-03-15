require 'rails_helper'

describe Api::V1::SearchController, type: :request, auth: true do
  describe '#GET #search', search: true do
    let!(:organization) { create(:organization) }
    let(:current_user) { @user }
    let!(:collections) { create_list(:collection, 3, organization: organization) }
    let!(:collection_with_text) do
      create(:collection, organization: organization, num_cards: 2)
    end
    let(:path) { '/api/v1/search' }
    let(:find_collection) { collections.first }

    before do
      current_user.add_role(:member, organization.primary_group)
      Collection.reindex
    end

    it 'returns a 200' do
      get(path, params: { query: '' })
      expect(response.status).to eq(200)
    end

    it 'returns collection that matches name search' do
      get(path, params: { query: find_collection.name })
      expect(json['data'].size).to be(1)
      expect(json['data'].first['id'].to_i).to eq(find_collection.id)
    end

    it 'returns collection that matches sub-item text search' do
      text = collection_with_text.collection_cards.first.item.plain_content
      get(path, params: { query: text })
      expect(json['data'].size).to be(1)
      expect(json['data'].first['id'].to_i).to eq(collection_with_text.id)
    end

    it 'returns empty array if no match' do
      get(path, params: { query: 'bananas' })
      expect(json['data']).to be_empty
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
