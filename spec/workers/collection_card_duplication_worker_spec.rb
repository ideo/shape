require 'rails_helper'

RSpec.describe CollectionCardDuplicationWorker, type: :worker do
  describe '#perform' do
    # it 'clones all the collection cards' do
    #   expect(duplicate.collection_cards.size).to eq(5)
    #   expect(collection.collection_cards.map(&:id)).not_to match_array(duplicate.collection_cards.map(&:id))
    # end
    #
    # it 'clones all items' do
    #   expect(duplicate.items.size).to eq(5)
    #   expect(collection.items.map(&:id)).not_to match_array(duplicate.items.map(&:id))
    # end
    #
    # it 'clones all roles on collection' do
    #   expect(duplicate.roles.map(&:name)).to match(collection.roles.map(&:name))
    #   expect(duplicate.can_edit?(user)).to be true
    # end
    #
    # it 'clones all roles on items' do
    #   expect(duplicate.items.all? { |item| item.can_edit?(user) }).to be true
    # end
    #
    # it 'clones tag list' do
    #   expect(duplicate.tag_list).to match_array collection.tag_list
    # end
    #
    # context 'with items you can\'t see' do
    #   let!(:hidden_item) { collection.items.first }
    #   let!(:viewable_items) { collection.items - [hidden_item] }
    #
    #   before do
    #     user.remove_role(Role::EDITOR, hidden_item)
    #   end
    #
    #   it 'duplicates collection' do
    #     expect { duplicate }.to change(Collection, :count).by(1)
    #   end
    #
    #   it 'duplicates all viewable items' do
    #     # Use cloned_from to get original items
    #     expect(duplicate.items.map(&:cloned_from)).to match_array(viewable_items)
    #     expect(duplicate.items(&:cloned_from)).not_to include(hidden_item)
    #   end
    # end
  end
end
