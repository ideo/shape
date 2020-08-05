require 'rails_helper'

describe UserTaggable, type: :concern do
  let(:collection) { create(:collection) }
  let(:users) { create_list(:user, 3) }
  let(:user) { users.first }
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
        expect(collection.reload.user_tag_list).to eq([user_tag.user.handle])
      end
    end

    describe '#add' do
      it 'adds tag' do
        collection.user_tag_list.add(user.handle)
        expect { collection.save }.to change(UserTag, :count).by(1)
        collection.reload
        expect(collection.user_tag_list).to eq([user.handle])
      end
    end

    describe '#remove' do
      before do
        collection.update(user_tag_list: [user.handle, users[1].handle])
      end

      it 'removes tag' do
        collection.user_tag_list.remove(user.handle)
        expect { collection.save }.to change(UserTag, :count).by(-1)
        collection.reload
        expect(collection.user_tag_list).to eq([users[1].handle])
      end
    end

    context 'with a challenge submission' do
      let(:challenge) { create(:collection, collection_type: :challenge) }
      let(:submission_box) { create(:submission_box, parent_collection: challenge) }
      let(:submissions_collection) { submission_box.submissions_collection }
      let(:submission) { create(:collection, :submission, parent_collection: submissions_collection) }
      # the submission is the collection being tagged
      let(:collection) { submission }

      before { submission_box.setup_submissions_collection! }

      describe '#add' do
        it 'creates a reviewer filter on the submissions collection' do
          collection.user_tag_list.add(user.handle)
          expect {
            collection.save
          }.to change(submissions_collection.collection_filters, :count).by(1)
          user_filter = submissions_collection.collection_filters.first.user_collection_filters.first
          expect(user_filter.user).to eq user
          expect(user_filter.selected).to be true
        end
      end

      describe '#remove' do
        before do
          collection.update(user_tag_list: [user.handle])
        end

        it 'removes the reviewer filter on the submissions collection' do
          expect(submissions_collection.collection_filters.count).to eq 1
          # now remove
          expect {
            collection.update(user_tag_list: [])
          }.to change(submissions_collection.collection_filters, :count).by(-1)
          expect(submissions_collection.collection_filters.count).to eq 0
        end

        context 'when reviewer still relevant via another submission' do
          let(:submission_2) { create(:collection, :submission, parent_collection: submissions_collection) }
          before do
            # both submissions are now tagged with the user
            submission.update(user_tag_list: [user.handle])
            submission_2.update(user_tag_list: [user.handle])
          end

          it 'keeps the reviewer filter on the submissions collection' do
            expect(submissions_collection.collection_filters.count).to eq 1
            # now remove -- count should stay the same
            expect {
              submission_2.update(user_tag_list: [])
            }.not_to change(submissions_collection.collection_filters, :count)
            expect(submissions_collection.collection_filters.count).to eq 1
          end
        end
      end
    end
  end

  describe '#user_tag_list=' do
    let(:user_tag_list) { users.map(&:handle) }

    it 'assigns users from their handle' do
      expect {
        collection.update(user_tag_list: user_tag_list)
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
          collection.update(user_tag_list: user_tag_list)
        }.not_to change(UserTag, :count)
      end
    end

    context 'if already tagged with users' do
      let!(:user_tag) { create(:user_tag, record: collection) }

      it 'removes users not included' do
        expect(UserTag.exists?(user_tag.id)).to be true
        expect(collection.reload.user_tag_list).to eq([user_tag.user.handle])
        collection.update(user_tag_list: user_tag_list)
        expect(UserTag.exists?(user_tag.id)).to be false
        expect(collection.reload.user_tag_list).to eq(user_tag_list)
      end
    end
  end
end
