RSpec.shared_context 'CardDuplicatorMapper setup' do
  before { network_mailing_list_doubles }
  let(:user) { create(:user) }
  let(:batch_id) { SecureRandom.hex(10) }
  let!(:organization) { create(:organization, slug: 'interstellar') }
  let!(:root_collection) { create(:collection, organization: organization, add_editors: [user]) }
  let!(:parent_collection) { create(:collection, parent_collection: root_collection) }
  let(:text_item) { create(:text_item, parent_collection: parent_collection) }
  let!(:search_collection_target) { create(:collection, parent_collection: parent_collection) }
  let!(:search_collection) do
    create(
      :search_collection,
      parent_collection: parent_collection,
      search_term: "planet within:#{search_collection_target.id}",
    )
  end
  let!(:collection_with_filter_target) { create(:collection, parent_collection: parent_collection) }
  let!(:collection_with_filter) { create(:collection, parent_collection: parent_collection) }
  let!(:collection_filter) do
    create(
      :collection_filter,
      collection: collection_with_filter,
      text: "galactic within:#{collection_with_filter_target.id}",
    )
  end
  let!(:linked_text_card) { create(:collection_card_link_text, parent: parent_collection, item: text_item) }
  let!(:archivable_parent_collection) { create(:collection, parent_collection: root_collection) }
  let(:archivable_text_item) { create(:text_item, parent_collection: parent_collection) }
  let!(:archived_linked_text_card) do
    card = create(
      :collection_card_link_text,
      parent: archivable_parent_collection,
      item: archivable_text_item,
    )
    card.archive!
    card
  end
  let!(:cards) do
    [
      text_item.parent_collection_card,
      search_collection.parent_collection_card,
      search_collection_target.parent_collection_card,
      collection_with_filter.parent_collection_card,
      collection_with_filter_target.parent_collection_card,
      linked_text_card,
      archived_linked_text_card,
    ]
  end
  let(:card_ids) { cards.map(&:id) }
  before do
    # Reload so it picks up all relationships
    parent_collection.reload
  end
end
