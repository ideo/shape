require 'rails_helper'

RSpec.describe RemoveCommentThreadFollowers, type: :worker do
  describe '#perform' do
    let(:user) { create(:user) }
    let(:editor) { create(:user) }
    let(:editor_via_group) { create(:user) }
    let(:group) { create(:group, add_members: [editor, editor_via_group]) }
    let(:followers) { [user, editor] }
    let(:group_followers) { [group] }
    let(:collection) { create(:collection, add_editors: [editor]) }
    let(:comment_thread) do
      create(
        :comment_thread,
        record: collection,
        add_followers: followers,
        add_group_followers: group_followers,
      )
    end

    it 'removes groups and removes users as followers if they don\'t still have access' do
      expect(comment_thread.groups_threads.map(&:group)).to match_array([group])
      expect(comment_thread.users_threads.map(&:user)).to match_array([user, editor, editor_via_group])
      RemoveCommentThreadFollowers.new.perform(
        comment_thread.id,
        [user.id],
        group_followers.map(&:id),
      )
      comment_thread.reload
      # group should be removed
      expect(comment_thread.groups_threads.map(&:group)).to match_array([])
      # should have removed the individual user, and the editor_via_group
      expect(comment_thread.users_threads.map(&:user)).to match_array([editor])
    end
  end
end
