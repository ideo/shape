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
    create(:master_template, organization: organization, num_cards: 3, record_type: :image, pin_cards: true)
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
      expect(user_profile.can_edit?(user)).to be true
      expect(user_profile.collection_cards.first.record.can_edit?(user)).to be true
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

    it 'should add the #profile tag' do
      expect(user_profile.cached_owned_tag_list).to match_array(['profile'])
    end

    context 'profile image' do
      it 'should replace the first image with the user.pic_url_square' do
        placeholder = template.collection_cards.first.item.image_url
        expect(user_profile.collection_cards.first.item.image_url).not_to eq placeholder
        expect(user_profile.collection_cards.first.item.image_url).to eq user.pic_url_square
      end

      context 'with default user image' do
        let(:user) { create(:user, add_to_org: organization, pic_url_square: nil) }

        it 'should not replace the first image with the user.pic_url_square' do
          placeholder = template.collection_cards.first.item.image_url
          expect(user_profile.collection_cards.first.item.image_url).to eq placeholder
        end
      end
    end

    context 'un-archiving a member' do
      before do
        user_profile.archive!
      end

      it 'should un-archive the profile and re-add user as editor' do
        expect(user_profile.archived?).to be true
        expect(AddRolesToChildrenWorker).to receive(:perform_async).with(
          [user.id],
          [],
          Role::EDITOR,
          user_profile.id,
          'Collection',
        )
        found = Collection::UserProfile.find_or_create_for_user(
          user: user,
          organization: organization,
        )
        expect(user_profile.reload.archived?).to be false
        # make sure it found the same one
        expect(found.id).to eq user_profile.id
      end
    end
  end
end
