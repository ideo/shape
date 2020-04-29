RSpec.shared_context 'CollectionUpdateBroadcaster setup' do
  let(:broadcaster_instance) { double('broadcaster') }
  before do
    allow(broadcaster_instance).to receive_messages(
      reload_cards: true,
      collection_updated: true,
      cards_updated: true,
      card_updated: true,
      card_attrs_updated: true,
      cards_archived: true,
      row_updated: true,
      text_item_updated: true,
    )
    allow(CollectionUpdateBroadcaster).to receive(:new).and_return(broadcaster_instance)
  end
end
