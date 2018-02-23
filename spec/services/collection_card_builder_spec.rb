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
    }
  end

  describe '#create' do
    context 'success creating card with collection' do
      let(:builder) do
        CollectionCardBuilder.new(
          params: params.merge(collection_attributes: {
            name: 'Cool Collection',
          }),
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

    context 'success creating card with item' do
      let(:builder) do
        CollectionCardBuilder.new(
          params: params.merge(item_attributes: {
            name: 'My item name',
            content: 'My Text Content goes here',
            type: 'Item::TextItem',
          }),
          collection: parent,
          user: user,
        )
      end

      before do
        expect(builder.create).to be true
      end

      it 'should calculate the breadcrumb for the card\'s child item' do
        created_item = builder.collection_card.item
        crumb = ['Collection', parent.id, parent.name]
        expect(created_item.breadcrumb.first).to eq crumb

        crumb = ['Item', created_item.id, 'My item name']
        expect(created_item.breadcrumb.last).to eq crumb
      end
    end

    context 'error because the item has no type' do
      # attempt to build card without any item or collection
      let(:builder) do
        CollectionCardBuilder.new(
          params: params.merge(item_attributes: {
            name: 'My item name',
            content: 'My Text Content goes here',
          }),
          collection: parent,
          user: user,
        )
      end

      before do
        expect(builder.create).to be false
      end

      it 'should display errors' do
        expect(builder.errors.full_messages.first).to eq "Item type can't be blank"
      end
    end

    context 'error because there is no related record' do
      # attempt to build card without any item or collection
      let(:builder) do
        CollectionCardBuilder.new(
          params: params,
          collection: parent,
          user: user,
        )
      end

      before do
        expect(builder.create).to be false
      end

      it 'should display errors' do
        expect(builder.errors.full_messages.first).to eq "Record can't be blank"
      end
    end

    context 'error when trying to create both related records' do
      # attempt to build card without any item or collection
      let(:builder) do
        CollectionCardBuilder.new(
          params: params.merge(
            collection_attributes: {
              name: 'Test',
            },
            item_attributes: {
              content: 'Test Content',
              type: 'Item::TextItem',
            },
          ),
          collection: parent,
          user: user,
        )
      end

      before do
        expect(builder.create).to be false
      end

      it 'should display errors' do
        expect(builder.errors.full_messages.first).to eq 'Only one of Item or Collection can be assigned'
      end
    end
  end
end
