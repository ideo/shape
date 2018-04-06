require 'rails_helper'

RSpec.describe CachedAttributes, type: :serializer do
  let(:user) { create(:user) }
  let(:collection) { create(:collection, add_editors: [user]) }
  let(:jsonapi_expose) do
    {
      url_helpers: ::Rails.application.routes.url_helpers,
      current_user: user,
      current_ability: Ability.new(user),
    }
  end
  let(:serialized) do
    JSONAPI::Serializable::Renderer.new.render(
      collection,
      class: { Collection: SerializableCollection },
      expose: jsonapi_expose,
    )
  end
  let(:serialized_attrs) { serialized[:data][:attributes] }

  it 'has tag_list as a cached attribute' do
    expect(SerializableCollection.cached_attribute?(:tag_list)).to be true
  end

  it 'does not have id as cached attribute' do
    expect(SerializableCollection.cached_attribute?(:id)).to be false
  end

  it 'sets attribute in cache' do
    allow(Cache).to receive(:get).and_return(nil)
    collection.update_attributes(tag_list: 'unicorns, rainbows')
    expect(Cache).to receive(:set).with(
      instance_of(String),
      tag_list: ['unicorns', 'rainbows'],
    )
    serialized
  end

  context 'with cached value' do
    before do
      allow(Cache).to receive(:get).and_return(
        tag_list: 'bananas, grapes',
      )
    end

    it 'gets attribute from cache' do
      expect(collection.tag_list).not_to eq('bananas, grapes')
      expect(serialized_attrs[:tag_list]).to eq('bananas, grapes')
    end
  end
end
