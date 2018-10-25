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
  let(:instance) { builder.call }

  describe '#call' do
    it 'should create a new collection that is linked to the template' do
      expect(instance.template).to eq template
      expect(instance.name).to eq "My #{template.name}"
    end

    it 'should give the creator editor access to collection and its items' do
      expect(instance.can_edit?(user)).to be true
      expect(instance.collection_cards.first.record.can_edit?(user)).to be true
    end

    it 'should give parent collection users the same access to collection and its items' do
      expect(instance.can_view?(viewer)).to be true
      expect(instance.collection_cards.first.record.can_view?(viewer)).to be true
    end

    it 'should create a new collection instance that copies the pinned cards from the template' do
      expect(instance.collection_cards.count).to eq template.collection_cards.count
    end

    it 'should create a new collection instance that copies the pinned cards from the template' do
      expect(instance.collection_cards.count).to eq template.collection_cards.count
    end

    it 'should assign current user as created_by' do
      expect(instance.created_by).to eq user
    end

    it 'should place the collection instance in the parent collection' do
      instance # evaluate builder.call
      parent.reload
      expect(parent.primary_collection_cards.first.record).to eq instance
      expect(parent.primary_collection_cards.map(&:order)).to match_array [0, 1, 2]
      # breadcrumb should include parent collection and self
      expect(instance.breadcrumb).to match_array([parent.id])
      expect(instance.items.first.breadcrumb).to match_array([parent.id, instance.id])
    end

    it 'should tag the collection instance with the template name' do
      expect(instance.owned_tag_list).to include(template.name.parameterize)
    end

    context 'when parent is a submissions_collection' do
      let(:submission_box) { create(:submission_box, add_editors: [user], add_viewers: [viewer]) }
      let(:parent) { create(:submissions_collection, submission_box: submission_box) }

      it 'should create a new collection that is linked to the template' do
        expect(instance.name).to eq "#{user.first_name}'s #{template.name}"
      end

      it 'should assign permissions from the submission_box' do
        expect(instance.can_edit?(user)).to be true
        expect(instance.collection_cards.first.record.can_edit?(user)).to be true
        expect(instance.can_view?(viewer)).to be true
        expect(instance.collection_cards.first.record.can_view?(viewer)).to be true
      end
    end

    context 'when parent is a master_template' do
      let(:parent) { create(:collection, master_template: true) }

      it 'should pin the collection instance' do
        expect(instance.parent_collection_card.pinned?).to be true
      end
    end

    context 'without a proper template' do
      let(:template) { create(:collection) }

      it 'should return false and give errors' do
        expect(instance).to be false
        expect(builder.errors.full_messages).to match_array [
          'Can only build a template instance from a master template',
        ]
      end
    end

    context 'with a test template as a sub-collection' do
      let!(:test_collection) do
        create(:test_collection,
               master_template: true,
               collection_to_test: template)
      end
      let(:template_card) { create(:collection_card_collection, collection: test_collection) }
      before do
        template.collection_cards << template_card
        template.reload
      end
      let(:test_instance_coll_card) do
        instance.collection_cards.where(
          templated_from: template_card.id,
        ).first
      end
      let(:test_instance) { test_instance_coll_card.collection }

      it 're-assigns collection_to_test to collection instance' do
        expect(test_collection.collection_to_test).to eq(template)
        expect(test_instance.master_template?).to be true
        expect(test_instance.collection_to_test).to eq(instance)
      end

      it 'should not prefix test name with "My"' do
        expect(test_instance.name).to eq(test_collection.name)
        expect(test_instance.name).not_to match(/^My/i)
      end
    end
  end
end
