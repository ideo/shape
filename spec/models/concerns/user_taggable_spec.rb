require 'rails_helper'

describe UserTaggable, type: :concern do
  let(:collection) { create(:collection) }
  let(:users) { create_list(:user, 3) }
  subject { Collection }

  it 'is included in Collection' do
    expect(Collection.ancestors).to include(UserTaggable)
  end

  describe '#user_tag_list' do
    it 'returns empty array if no user tags' do
      expect(collection.user_tag_list).to be_empty
    end

    context 'with user tags' do
      let!(:user_tag) { create(:user_tag, record: collection) }

      it 'returns array of user handles' do
        expect(collection.user_tag_list).to eq([user_tag.user.handle])
      end
    end
  end

  describe '#user_tag_list=' do
    let(:user_tag_list) { users.map(&:handle) }

    it 'assigns users from their handle' do
      expect {
        collection.user_tag_list = user_tag_list
      }.to change(UserTag, :count).by(3)
    end

    context 'if collection is new record' do
      let!(:collection) { build(:collection) }

      it 'assigns on save' do
        collection.user_tag_list = user_tag_list
        expect(collection.new_record?).to be true
        expect {
          collection.save
        }.to change(UserTag, :count).by(3)
      end
    end

    context 'if handle is invalid' do
      let!(:user_tag_list) { ['fakeUserHandle123'] }

      it 'does not assign anything' do
        expect {
          collection.user_tag_list = user_tag_list
        }.not_to change(UserTag, :count)
      end
    end

    context 'if already tagged with users' do
      let!(:user_tag) { create(:user_tag, record: collection) }

      it 'removes users not included' do
        expect(UserTag.exists?(user_tag.id)).to be true
        collection.user_tag_list = user_tag_list
        expect(UserTag.exists?(user_tag.id)).to be false
        expect(collection.reload.user_tag_list).to eq(user_tag_list)
      end
    end
  end
end
