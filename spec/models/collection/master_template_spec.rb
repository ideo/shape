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
end
