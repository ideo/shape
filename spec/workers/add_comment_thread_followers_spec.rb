require 'rails_helper'

RSpec.describe AddCommentThreadFollowers, type: :worker do
  describe '#perform' do
    let(:editor) { create(:user) }
    let(:editor_via_group) { create(:user) }
    let(:group) { create(:group, add_members: [editor_via_group]) }
    let(:editors) { [editor, group] }
    let(:viewers) { create_list(:user, 2) }
    let(:collection) { create(:collection, add_editors: editors, add_viewers: viewers) }
    let(:comment_thread) { create(:comment_thread, record: collection) }

    context 'with a single comment thread' do
      before do
        AddCommentThreadFollowers.new.perform(comment_thread.id)
      end

      it 'adds all record editor users as followers' do
        expect(comment_thread.users_threads.map(&:user)).to match_array([editor, editor_via_group])
        expect(editor.comment_threads).to include(comment_thread)
      end

      it 'adds all record editor groups as followers' do
        expect(comment_thread.groups_threads.map(&:group)).to match_array([group])
        expect(editor_via_group.comment_threads).to include(comment_thread)
      end
    end

    context 'with an array of comment thread ids' do
      let(:comment_threads) { create_list(:item_comment_thread, 2) }
      let(:users_to_add) { create_list(:user, 2) }

      before do
        AddCommentThreadFollowers.new.perform(
          comment_threads.map(&:id),
          users_to_add.map(&:id),
        )
      end

      it 'adds all users as followers' do
        expect(comment_threads.first.users_threads.map(&:user)).to match_array(users_to_add)
        expect(comment_threads.second.users_threads.map(&:user)).to match_array(users_to_add)
      end
    end
  end
end
