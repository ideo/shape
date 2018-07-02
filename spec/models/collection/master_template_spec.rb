require 'rails_helper'

describe Collection::MasterTemplate, type: :model do
  describe '#profile_template?' do
    let!(:organization) { create(:organization) }
    let(:user) { create(:user) }
    let!(:template_collection) { organization.setup_templates(user) }
    let!(:profile_template) { organization.profile_template }

    it 'should return true if its the orgs profile template' do
      expect(profile_template.profile_template?).to be true
    end
  end

  describe '#setup_profile_template' do
    let(:profile_template) { create(:master_template) }
    let(:filestack_file) { create(:filestack_file) }

    before do
      allow(FilestackFile).to receive(:create_from_url).and_return(filestack_file)
      profile_template.setup_profile_template
    end

    it 'should create two collection cards' do
      expect(profile_template.collection_cards.count).to eq 2
    end

    it 'should create a image item and a text item' do
      expect(profile_template.items.count).to eq 2
      expect(profile_template.items.first.type).to eq 'Item::ImageItem'
      expect(profile_template.items.last.type).to eq 'Item::TextItem'
    end
  end
end
