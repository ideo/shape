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
end
