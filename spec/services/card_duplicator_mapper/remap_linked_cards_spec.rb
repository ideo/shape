require 'rails_helper'
require_relative 'shared_setup'

RSpec.describe CardDuplicatorMapper::RemapLinkedCards, type: :service do
  include_context 'CardDuplicatorMapper setup'
  let(:duplicate_to_collection) do
    create(
      :collection,
      organization: organization,
      parent_collection: root_collection,
    )
  end
  before do
    # Note: if you try to duplicate all cards explicitly,
    # it will turn any link cards into real duplicates
    CollectionCardDuplicator.call(
      to_collection: duplicate_to_collection,
      cards: [parent_collection.parent_collection_card],
      placement: 'end',
      for_user: user,
      batch_id: batch_id,
      synchronous: :all_levels,
    )
    duplicate_to_collection.reload
  end
  let(:duplicated_parent_collection) do
    duplicate_to_collection.collections.where(
      cloned_from_id: parent_collection.id,
    ).first
  end
  let(:duplicate_text_item) do
    duplicated_parent_collection.items.where(
      cloned_from_id: text_item.id,
    ).first
  end
  let(:duplicate_link_text_card) do
    duplicated_parent_collection.collection_cards.link.first
  end
  let(:duplicate_search_collection_target) do
    duplicated_parent_collection.collections.where(
      cloned_from_id: search_collection_target.id,
    ).first
  end
  let(:duplicate_search_collection) do
    duplicated_parent_collection.collections.where(type: 'Collection::SearchCollection').first
  end
  let(:duplicate_collection_with_filter_target) do
    duplicated_parent_collection.collections.where(
      cloned_from_id: collection_with_filter_target.id,
    ).first
  end
  let(:duplicate_collection_with_filter) do
    duplicated_parent_collection.collections.joins(:collection_filters).first
  end

  describe '#call' do
    it 're-assigns link to duplicated card' do
      expect(duplicate_link_text_card.item).to eq(duplicate_text_item)
    end

    it 're-assigns search collection to duplicated search collection target' do
      expect(duplicate_search_collection.within_collection_id.present?).to be true
      expect(
        duplicate_search_collection.within_collection_id,
      ).to eq(
        duplicate_search_collection_target.id,
      )
    end

    it 're-assigns collection filter to duplicated collection filter target' do
      duplicated_filter = duplicate_collection_with_filter.collection_filters.first
      expect(duplicated_filter.within_collection_id.present?).to be true
      expect(
        duplicated_filter.within_collection_id,
      ).to eq(
        duplicate_collection_with_filter_target.id,
      )
    end
  end
end
