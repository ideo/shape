require 'rails_helper'

# seed first to get the two global default audiences
RSpec.describe Audience, type: :model, seed: true do
  context 'associations' do
    it { should have_many :audience_organizations }
    it { should have_many :organizations }
    it { should have_many :test_audiences }
  end

  context 'validations' do
    it { should validate_presence_of(:name) }
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

  describe '.viewable_by_org' do
    let(:organization) { create(:organization_without_groups) }
    let(:organization2) { create(:organization_without_groups) }
    let!(:audiences_global) { create_list(:audience, 1) }
    let!(:audiences) { create_list(:audience, 2, organizations: [organization]) }
    let!(:audiences2) { create_list(:audience, 2, organizations: [organization2]) }
    let(:user) { create(:user) }

    let(:viewable_by_org) do
      Audience.viewable_by_org(organization)
    end
    let(:viewable_by_user_in_org) do
      Audience.viewable_by_user_in_org(user: user, organization: organization)
    end

    it 'should only return audiences in the organization (2), global (1), challenges(3), and global defaults (2)' do
      expect(viewable_by_org.size).to eq 8
      # should not include 2 Audiences outside the org
      expect(Audience.count).to eq 10
    end

    it 'should return the same count for .viewable_by_user_in_org' do
      expect(viewable_by_user_in_org.to_a.size).to eq 8
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

  describe '.minimum_price_per_response' do
    it 'returns minimum value so we do not lose money' do
      incentive_amount = Audience::MIN_INCENTIVE_PER_RESPONDENT
      paypal_fee = (incentive_amount * BigDecimal('0.05')).round(2)
      stripe_fee = (((incentive_amount + paypal_fee) * BigDecimal('0.029')) + BigDecimal('0.30')).round(2)
      expect(Audience.minimum_price_per_response).to eq(
        (incentive_amount + paypal_fee + stripe_fee).to_f,
      )
    end
  end

  describe '#all_tags' do
    let!(:audience) { create(:audience, country_list: %w[canada usa], interest_list: %w[fun music]) }

    it 'should return a hash with all the tags' do
      all_tags = audience.all_tags
      expect(all_tags[:countries]).to match_array(%w[canada usa])
      expect(all_tags[:interests]).to match_array(%w[fun music])
    end
  end

  describe '#price_per_response' do
    let!(:all_people) { create(:audience, min_price_per_response: 3.75) }
    let!(:targeted_audience) { create(:audience, min_price_per_response: 4, interest_list: %w[fun music]) }

    it 'returns correct amount for # of questions' do
      # $3.75 + ((43 - 10) x $0.12) = $7.71
      expect(all_people.price_per_response(43)).to eq(7.71)
      # $4 + ((43 - 10) x $0.12) = $7.96
      expect(targeted_audience.price_per_response(43)).to eq(7.96)
    end

    context 'if less than 10 questions' do
      it 'returns minimum price of 10 questions' do
        # $3.75 + (0 x $0.12) = $3.75
        expect(all_people.price_per_response(9)).to eq(3.75)
        # $4 + (0 x $0.12) = $4
        expect(targeted_audience.price_per_response(9)).to eq(4)
      end
    end

    context 'if link sharing audience' do
      before do
        all_people.update(min_price_per_response: 0)
      end

      it 'returns 0' do
        expect(all_people.price_per_response(43)).to eq(0)
      end
    end
  end

  describe '#incentive_per_response' do
    let!(:all_people) { create(:audience, min_price_per_response: 3.75) }
    let!(:targeted_audience) { create(:audience, min_price_per_response: 4, interest_list: %w[fun music]) }

    it 'returns correct amount for # of questions' do
      # $1.75 + ((43 - 10) x $0.10) = $5.05
      expect(all_people.incentive_per_response(43)).to eq(5.05)
      expect(targeted_audience.incentive_per_response(43)).to eq(5.05)
    end

    context 'if less than 10 questions' do
      it 'returns minimum price of 10 questions' do
        # $1.75 + (0 x $0.10) = $2.75
        expect(all_people.incentive_per_response(9)).to eq(1.75)
        expect(targeted_audience.incentive_per_response(9)).to eq(1.75)
      end
    end

    context 'if link sharing audience' do
      before do
        all_people.update(min_price_per_response: 0)
      end

      it 'returns 0' do
        expect(all_people.incentive_per_response(43)).to eq(0)
      end
    end
  end
end
