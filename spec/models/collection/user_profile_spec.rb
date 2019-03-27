require 'rails_helper'

describe Collection::UserProfile, type: :model do
  let(:organization) { create(:organization) }
  let(:user) { create(:user, add_to_org: organization) }
  let(:user_profile) do
    Collection::UserProfile.find_or_create_for_user(
      user: user,
      organization: organization,
    )
  end

  let(:template) do
    create(
      :collection,
      master_template: true,
      organization: organization,
      num_cards: 3,
      record_type: :image,
      pin_cards: true,
    )
  end
  let(:profiles) { create(:global_collection, organization: organization) }

  before do
    # configure the org to set up the necessary global collections
    organization.update(
      profile_template: template,
      profile_collection: profiles,
    )
  end

  context 'callbacks' do
    describe 'update_user_cached_profiles!' do
      it 'should set the user.cached_user_profiles attribute' do
        expect(user.cached_user_profiles).not_to be nil
        expect(user.cached_user_profiles[organization.id.to_s]).to eq user_profile.id
      end
    end
  end

  describe '.find_or_create_for_user' do
    it 'should copy the cards from the org profile_template' do
      expect(user_profile.collection_cards.count).to eq 3
    end

    it 'should set the collection name to the user\'s name' do
      expect(user_profile.name).to eq user.name
    end

    it 'should set the user as editor of profile and items' do
      user_profile.reload
      expect(user_profile.can_edit?(user)).to be true
      expect(user_profile.collection_cards.first.record.can_edit?(user)).to be true
    end

    it 'should set the organization admin_group as editor of profile and items' do
      expect(user_profile.can_edit?(organization.admin_group)).to be true
      expect(user_profile.collection_cards.first.record.can_edit?(organization.admin_group)).to be true
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

    it 'should add the #profile tag' do
      expect(user_profile.cached_owned_tag_list).to match_array(['profile'])
    end

    context 'profile image' do
      it 'should replace the first image with the user.picture_medium' do
        placeholder = template.collection_cards.first.item.image_url
        expect(user_profile.collection_cards.first.item.filestack_file.url).not_to eq placeholder
        expect(user_profile.collection_cards.first.item.filestack_file.url).to eq user.picture_medium
      end

      context 'with default user image' do
        let(:user) { create(:user, add_to_org: organization, picture_medium: nil) }

        it 'should not replace the first image with the user.picture_medium' do
          placeholder = template.collection_cards.first.item.image_url
          expect(user_profile.collection_cards.first.item.image_url).to eq placeholder
        end
      end
    end

    context 'unarchiving a member' do
      before do
        user_profile.archive!
      end

      it 'should unarchive the profile and re-add user as editor' do
        expect(user_profile.archived?).to be true
        found = Collection::UserProfile.find_or_create_for_user(
          user: user,
          organization: organization,
        )
        expect(user_profile.reload.archived?).to be false
        # make sure it found the same one
        expect(found.id).to eq user_profile.id
        # should be back as editor
        expect(user_profile.can_edit?(user)).to be true
        expect(user_profile.items.first.can_edit?(user)).to be true
      end
    end
  end
end
