require 'rails_helper'

describe Collection::UserProfile, type: :model do
  describe '.find_or_create_for_user' do
    let(:organization) { create(:organization) }
    let(:template) { create(:master_template, organization: organization, num_cards: 3) }
    let(:profiles) { create(:global_collection, organization: organization) }
    let(:user) { create(:user, add_to_org: organization) }
    let(:user_profile) do
      Collection::UserProfile.find_or_create_for_user(
        user: user,
        organization: organization,
      )
    end

    before do
      organization.update(
        profile_template: template,
        profile_collection: profiles,
      )
      template.collection_cards.update_all(pinned: true)
      # user_profile.reload
    end

    it 'should copy the cards from the org profile_template' do
      expect(user_profile.collection_cards.count).to eq 3
    end

    it 'should set the collection name to the user\'s name' do
      expect(user_profile.name).to eq user.name
    end

    it 'should set the user as content editor of profile and items' do
      expect(user_profile.can_edit?(user)).to be false
      expect(user_profile.can_edit_content?(user)).to be true
      expect(user_profile.collection_cards.first.record.can_edit?(user)).to be false
      expect(user_profile.collection_cards.first.record.can_edit_content?(user)).to be true
    end

    it 'should copy the pinned status of the template cards' do
      expect(user_profile.collection_cards.first.pinned?).to be true
    end

    it 'should create a card in the Profiles template' do
      # need to do this to pick up collection_card relation?
      user_profile.reload
      expect(profiles.collection_cards.count).to eq 1
      expect(profiles.collection_cards.first.record).to eq user_profile
    end

    it 'should create a linked card in the user\'s My Collection' do
      # need to do this to pick up collection_card relation?
      user_profile.reload
      expect(user.current_user_collection.collection_cards.count).to eq 2
      expect(user.current_user_collection.collection_cards.last.record).to eq user_profile
      expect(
        user.current_user_collection.collection_cards.last.is_a?(CollectionCard::Link),
      ).to be true
    end
  end
end
