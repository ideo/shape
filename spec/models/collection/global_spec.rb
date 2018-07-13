require 'rails_helper'

describe Collection::Global, type: :model do
  describe '#org_templates?' do
    let(:organization) { create(:organization) }
    let(:collection) { create(:global_collection, organization: organization) }

    before do
      organization.template_collection_id = collection.id
    end

    it 'should be true if the org template collection id is itself' do
      expect(collection.org_templates?).to be true
    end
  end

  describe '#profiles?' do
    let(:organization) { create(:organization) }
    let(:collection) { create(:global_collection, organization: organization) }

    before do
      organization.profile_collection_id = collection.id
    end

    it 'should be true if the org profile collection id is itself' do
      expect(collection.profiles?).to be true
    end
  end
end
