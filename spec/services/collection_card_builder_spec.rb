require 'rails_helper'

RSpec.describe CollectionCardBuilder, type: :service do
  let(:organization) { create(:organization) }
  let(:parent) { create(:collection, organization: organization) }
  let(:user) { create(:user) }
  let(:params) do
    {
      order: 1,
      width: 3,
      height: 1,
      # create with a nested item
      collection_attributes: {
        name: 'Cool Collection',
      },
    }
  end

  describe '#create' do
    let(:builder) do
      CollectionCardBuilder.new(
        params: params,
        collection: parent,
        user: user,
      )
    end

    before do
      expect(builder.create).to be true
    end

    it 'should add the user as editor to the card\'s child collection' do
      expect(user.has_role?(Role::EDITOR, builder.collection_card.collection)).to be true
    end

    it 'should calculate the breadcrumb for the card\'s child collection' do
      created_collection = builder.collection_card.collection
      crumb = ['Collection', parent.id, parent.name]
      expect(created_collection.breadcrumb.first).to eq crumb

      crumb = ['Collection', created_collection.id, 'Cool Collection']
      expect(created_collection.breadcrumb.last).to eq crumb
    end
  end
end
