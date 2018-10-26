require 'rails_helper'

RSpec.describe CollectionTemplateBuilder, type: :service do
  let(:organization) { create(:organization) }
  let(:template) do
    create(:collection, organization: organization, master_template: true, num_cards: 2, pin_cards: true)
  end
  let(:viewer) { create(:user) }
  let(:parent) { create(:collection, num_cards: 2, organization: organization, add_viewers: [viewer]) }
  let(:user) { create(:user) }
  let(:builder) do
    CollectionTemplateBuilder.new(
      parent: parent,
      template: template,
      placement: 'beginning',
      created_by: user,
    )
  end
  let(:collection) { builder.call }

  describe '#call' do
    it 'should create a new collection that is linked to the template' do
      expect(collection.template).to eq template
      expect(collection.name).to eq "My #{template.name}"
    end

    it 'should give the creator editor access to collection and its items' do
      expect(collection.can_edit?(user)).to be true
      expect(collection.collection_cards.first.record.can_edit?(user)).to be true
    end

    it 'should give parent collection users the same access to collection and its items' do
      expect(collection.can_view?(viewer)).to be true
      expect(collection.collection_cards.first.record.can_view?(viewer)).to be true
    end

    it 'should create a new collection that copies the pinned cards from the template' do
      expect(collection.collection_cards.count).to eq template.collection_cards.count
    end

    it 'should create a new collection that copies the pinned cards from the template' do
      expect(collection.collection_cards.count).to eq template.collection_cards.count
    end

    it 'should assign current user as created_by' do
      expect(collection.created_by).to eq user
    end

    it 'should place the collection instance in the parent collection' do
      collection # evaluate builder.call
      parent.reload
      expect(parent.primary_collection_cards.first.record).to eq collection
      expect(parent.primary_collection_cards.map(&:order)).to match_array [0, 1, 2]
      # breadcrumb should include parent collection and self
      expect(collection.breadcrumb).to match_array([parent.id])
      expect(collection.items.first.breadcrumb).to match_array([parent.id, collection.id])
    end

    it 'should tag the collection instance with the template name' do
      expect(collection.owned_tag_list).to include(template.name.parameterize)
    end

    context 'when parent is a submissions_collection' do
      let(:submission_box) { create(:submission_box, add_editors: [user], add_viewers: [viewer]) }
      let(:parent) { create(:submissions_collection, submission_box: submission_box) }

      it 'should create a new collection that is linked to the template' do
        expect(collection.name).to eq "#{user.first_name}'s #{template.name}"
      end

      it 'should assign permissions from the submission_box' do
        expect(collection.can_edit?(user)).to be true
        expect(collection.collection_cards.first.record.can_edit?(user)).to be true
        expect(collection.can_view?(viewer)).to be true
        expect(collection.collection_cards.first.record.can_view?(viewer)).to be true
      end
    end

    context 'when parent is a master_template' do
      let(:parent) { create(:collection, master_template: true) }

      it 'should pin the collection instance' do
        expect(collection.parent_collection_card.pinned?).to be true
      end
    end

    context 'without a proper template' do
      let(:template) { create(:collection) }

      it 'should return false and give errors' do
        expect(collection).to be false
        expect(builder.errors.full_messages).to match_array [
          'Can only build a template instance from a master template',
        ]
      end
    end
  end
end
