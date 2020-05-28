RSpec.shared_context 'CollectionCardFilter setup' do
  let(:user) { nil }
  let(:editor) { create(:user) }
  let(:viewer) { create(:user) }
  let(:super_admin) do
    user = create(:user)
    user.add_role(Role::SUPER_ADMIN)
    user
  end
  let(:organization) { create(:organization, admin: editor, member: viewer) }
  let!(:group) { create(:group, organization: organization) }
  let!(:collection) do
    create(:collection,
           organization: organization,
           num_cards: 5,
           record_type: :collection,
           add_viewers: [viewer])
  end
  let(:filters) { {} }
  let(:application) { nil }
  let(:cards) { collection.collection_cards }
  let(:visible_card_1) { cards[0] }
  let(:visible_card_2) { cards[1] }
  # NOTE: due to updates with CollectionCardRenderer
  # private card will always be output by CollectionCardFilter and then filtered out later
  let(:visible_cards) { [visible_card_1, visible_card_2, private_card] }
  let(:hidden_card) { cards[2] }
  let(:private_card) { cards[3] }
  let!(:archived_card) { cards[4] }
  let(:ids_only) { false }
  before do
    # And group to collection
    group.add_role(Role::VIEWER, collection)

    # Add editor directly to collection
    editor.add_role(Role::EDITOR, collection)

    cards.each do |card|
      record = card.record
      record.unanchor!
      editor.add_role(Role::EDITOR, record)
      if card == private_card
        # Make private card private
        record.cached_inheritance = { private: true, updated_at: Time.current }
        record.save
      else
        # Don't add group/viewer role to the private card
        group.add_role(Role::VIEWER, record)
      end
    end

    # Anchor visible and hidden cards
    [visible_card_1, visible_card_2, hidden_card].each do |card|
      card.record.update(roles_anchor_collection: collection)
    end

    # Hide the hidden card
    hidden_card.update(hidden: true)

    # Archive the last card
    archived_card.archive!
  end
end
