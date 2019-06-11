require 'rails_helper'

# seed first to get the two global default audiences
RSpec.describe Audience, type: :model, seed: true do
  context 'associations' do
    it { should have_many :audience_organizations }
    it { should have_many :organizations }
    it { should have_many :test_audiences }
  end

  describe '.global_defaults' do
    it 'should return Share via Link and All People' do
      expect(Audience.global_defaults.map(&:name)).to eq(
        [
          'Share via Link',
          'All People (No Filters)',
        ],
      )
    end
  end

  describe '.viewable_by_user_in_org' do
    let(:organization) { create(:organization_without_groups) }
    let(:user) { create(:user) }
    let(:viewable_by_user_in_org) do
      Audience.viewable_by_user_in_org(user: user, organization: organization)
    end

    it 'should always return the global defaults first' do
      expect(viewable_by_user_in_org.first(2)).to match_array(Audience.global_defaults)
    end

    context 'with recently used test audiences' do
      let(:audiences) { create_list(:audience, 5, organizations: [organization]) }
      let(:launched_audience) { audiences.last }
      let(:test_collection) { create(:test_collection, organization: organization) }
      let!(:test_audience) do
        create(:test_audience, audience: launched_audience, launched_by: user, test_collection: test_collection)
      end

      it 'should return the most recently launched test audience after the two global defaults' do
        expect(viewable_by_user_in_org.third).to eq launched_audience
      end
    end
  end
end
