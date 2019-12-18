require 'rails_helper'
require_relative 'shared_setup'

RSpec.describe CardDuplicatorMapper::FindLinkedCards, type: :service do
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
    Sidekiq::Testing.inline! do
      CollectionCardDuplicator.call(
        to_collection: duplicate_to_collection,
        cards: [parent_collection.parent_collection_card],
        placement: 'end',
        for_user: user,
        batch_id: batch_id,
      )
    end
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
    duplicated_parent_collection.collections.joins(:collection_filters).first
  end

  describe '#call' do
    it 're-assigns link to duplicated card' do
      expect(duplicate_link_text_card.item).to eq(duplicate_text_item)
    end

    it 're-assigns collection filter to duplicated search collection target' do
      expect(
        duplicate_search_collection.collection_filters.first.within_collection_id,
      ).to eq(
        duplicate_search_collection_target.id,
      )
    end

    # TODO: it appears fakeredis may not support expiration using
    xit 'expires cached data for this duplication batch after one day' do
      base = CardDuplicatorMapper::Base.new(batch_id: batch_id)
      expect(base.duplicated_cards).not_to be_empty
      expect(base.linked_cards).not_to be_empty

      Timecop.travel(25.hours.from_now) do
        expect(base.duplicated_cards).to be_empty
        expect(base.linked_cards).to be_empty
      end
    end
  end
end
