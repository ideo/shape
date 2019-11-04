require 'rails_helper'

describe Api::V1::CollectionFiltersController, type: :request, json: true, auth: true do
  let(:user) { @user }

  describe 'POST #create' do
    let!(:collection) { create(:collection) }

    let(:path) { "/api/v1/collections/#{collection.id}/collection_filters" }
    let(:params) do
      {
      filter_type: 'tag',
      text: 'animals',
      }.to_json
    end

    before do
      user.add_role(Role::EDITOR, collection)
    end

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'creates a collection filter on the collection' do
      post(path, params: params)
      expect(collection.collection_filters.count).to eq(1)
      expect(collection.collection_filters.first.filter_type).to eq('tag')
    end
  end

  describe 'DELETE #destroy' do
    let!(:collection) { create(:collection) }
    let!(:collection_filter) { create(:collection_filter, collection: collection) }
    let(:path) { "/api/v1/collections/#{collection.id}/collection_filters/#{collection_filter.id}" }

    before do
      user.add_role(Role::EDITOR, collection)
    end

    it 'deletes the collection_filter' do
      expect {
        delete(path)
      }.to change(CollectionFilter, :count).from(1).to(0)
      expect(response.status).to eq(200)
    end
  end

  describe 'POST #select' do
    let!(:collection) { create(:collection) }
    let!(:collection_filter) { create(:collection_filter, collection: collection) }
    let(:path) { "/api/v1/collection_filters/#{collection_filter.id}/select" }

    context 'without an existing user collection filter' do
      it 'should create a new user collection filter' do
      expect {
        post(path)
      }.to change(UserCollectionFilter, :count).from(0).to(1)
      end

      it 'should update the new user collection filter to be selected' do
        post(path)
        expect(UserCollectionFilter.last.selected).to eq true
      end
    end

    context 'with an existing user collection filter' do
      let!(:user_collection_filter) do
        create(:user_collection_filter,
               collection_filter: collection_filter,
               user: user
              )
      end

      it 'should update the user collection filter to be selected' do
        post(path)
        expect(user_collection_filter.reload.selected).to eq true
      end

      context 'with unselect' do
        let(:path) { "/api/v1/collection_filters/#{collection_filter.id}/unselect" }
        it 'should update the user collection filter to be unselected' do
          post(path)

          expect(user_collection_filter.reload.selected).to eq false
        end
      end
    end
  end
end
