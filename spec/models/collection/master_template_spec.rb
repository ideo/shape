require 'rails_helper'

describe Collection::MasterTemplate, type: :model do
  context 'associations' do
    it { should have_many :templated_collections }
  end

  describe '#profile_template?' do
    let(:organization) { create(:organization) }
    let(:profile_template) { organization.profile_template }

    before do
      organization.create_profile_template(
        name: 'profile template',
        organization: organization,
      )
    end

    it 'should be a MasterTemplate' do
      expect(profile_template.type).to eq 'Collection::MasterTemplate'
    end

    it 'should return true if it\'s the org\'s profile template' do
      expect(profile_template.profile_template?).to be true
    end
  end

  describe '#setup_templated_collection' do
    let(:user) { create(:user) }
    let(:template) { create(:master_template, num_cards: 3, add_editors: [user]) }
    let(:collection) { create(:collection) }

    before do
      template.setup_templated_collection(
        for_user: user,
        collection: collection,
      )
    end

    it 'should copy the templated cards into the new collection' do
      expect(collection.collection_cards.count).to eq 3
    end

    it 'should set itself as the collection\'s template' do
      expect(collection.template).to eq template
    end
  end

  describe '#update_templated_collections' do
    let(:user) { create(:user) }
    let!(:template) { create(:master_template, num_cards: 3, pin_cards: true) }
    let!(:templated_collection) { create(:collection, template: template, created_by: user) }

    context 'with new collections' do
      it 'should copy the template\'s pinned cards into the templated collections' do
        template.update_templated_collections
        expect(templated_collection.collection_cards.count).to eq 3
      end
    end

    context 'with existing templated collection' do
      before do
        template.setup_templated_collection(
          for_user: user,
          collection: templated_collection,
        )

        #  now simulate some changes to both the templated, and template
        templated_collection.collection_cards << create(:collection_card_text)
        template.collection_cards.first.update(width: 3)
        template.collection_cards << create(:collection_card_text, pinned: true)
      end

      it 'should update all pinned cards to match any template updates' do
        template.update_templated_collections
        expect(templated_collection.collection_cards.count).to eq 5
        expect(templated_collection.collection_cards.pinned.count).to eq 4
        # unpinned card should get reordered to the end
        expect(templated_collection.collection_cards.last.pinned?).to eq false
        # templated card should take on the template pinned card changes
        expect(templated_collection.collection_cards.first.width).to eq 3
      end
    end
  end
end
