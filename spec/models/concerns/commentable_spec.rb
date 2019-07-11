require 'rails_helper'

describe Commentable, type: :concern do
  let!(:record) { create(:collection) }
  let!(:comment_thread) { create(:comment_thread, record: record, organization: record.organization) }
  let(:other_org) { create(:organization_without_groups) }

  it 'should have concern included' do
    expect(Item.ancestors).to include(Commentable)
    expect(Collection.ancestors).to include(Commentable)
  end

  context 'callbacks' do
    describe '#update_comment_threads_in_firestore' do
      let!(:comment_thread_2) { create(:collection_comment_thread, record: record, organization: other_org) }
      it 'should update all related threads' do
        expect(record.comment_threads.count).to eq 2
        record.comment_threads.each do |ct|
          expect(ct).to receive(:store_in_firestore)
        end
        record.update(name: 'New name')
      end
    end

    describe '#remove_comment_followers' do
      it 'should call the RemoveCommentThreadFollowers worker' do
        expect(RemoveCommentThreadFollowers).to receive(:perform_async).with(
          comment_thread.id,
        )
        record.archive!
      end
    end
  end

  describe '#comment_thread' do
    let!(:comment_thread_2) { create(:collection_comment_thread, record: record, organization: other_org) }

    it 'should return the comment_thread that matches the record\'s organization' do
      expect(record.comment_threads.count).to eq 2
      # should find the first and not the 2nd
      expect(record.comment_thread).to eq comment_thread
    end
  end
end
