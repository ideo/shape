require 'rails_helper'

RSpec.describe CardMover, type: :service do
  let(:user) { create(:user) }
  let(:organization) { create(:organization) }
  let(:from_collection) { create(:collection, organization: organization, num_cards: 3) }
  let(:to_collection) { create(:collection, organization: organization, num_cards: 3) }
  let!(:moving_cards) { from_collection.collection_cards }
  let(:cards) { moving_cards }
  let(:placement) { 'beginning' }
  let(:card_action) { 'move' }
  let(:card_mover) do
    CardMover.new(
      from_collection: from_collection,
      to_collection: to_collection,
      cards: cards,
      placement: placement,
      card_action: card_action,
    )
  end
  let(:instance_double) do
    double('Roles::MassAssign')
  end

  before do
    moving_cards.each do |card|
      user.add_role(Role::EDITOR, card.record)
    end
    user.add_role(Role::EDITOR, from_collection)
    user.add_role(Role::EDITOR, to_collection)

    allow(Roles::MassAssign).to receive(:new).and_return(instance_double)
    allow(instance_double).to receive(:call).and_return(true)
  end

  describe '#call' do
    context 'with placement "beginning"' do
      let(:placement) { 'beginning' }

      it 'should move cards into the to_collection at the beginning' do
        expect(from_collection.collection_cards).to match_array moving_cards
        card_mover.call
        expect(to_collection.reload.collection_cards.first(3)).to match_array moving_cards
      end

      context 'with same roles anchor' do
        before do
          moving_cards.each do |card|
            card.record.update(roles_anchor_collection_id: to_collection.id)
          end
        end

        it 'should not assign any permissions' do
          expect(Roles::MassAssign).not_to receive(:new)
          card_mover.call
        end
      end

      context 'with all roles from record included on to_collection' do
        let(:other_user) { create(:user) }
        let(:card) { moving_cards.first }

        before do
          user.add_role(Role::VIEWER, to_collection)
        end

        it 'should not assign any permissions and destroy card roles' do
          expect(Roles::MassAssign).not_to receive(:new)
          expect(card.record.roles).not_to be_empty
          card_mover.call
          expect(card.record.roles).to be_empty
        end
      end

      context 'with different roles' do
        let(:card) { moving_cards.first }
        let(:other_user) { create(:user) }
        let(:group) { create(:group) }

        before do
          # add a different role onto card.record so that it has more roles than the to_collection
          other_user.add_role(Role::VIEWER, card.record)
          # add a different role onto to_collection
          group.add_role(Role::EDITOR, to_collection)
        end

        it 'should assign permissions' do
          # will assign roles from the to_collection down to the card.record
          expect(Roles::MassAssign).to receive(:new).with(
            object: card.record,
            role_name: Role::EDITOR,
            users: [user],
            groups: [group],
            propagate_to_children: true,
          )
          card_mover.call
        end
      end

      it 'should recalculate breadcrumbs' do
        card = moving_cards.first
        card.item.recalculate_breadcrumb!
        expect {
          card_mover.call
        }.to change(card.item, :breadcrumb)
        # double check that breadcrumb is showing the new collection
        expect(card.item.breadcrumb.first).to eq to_collection.id
      end
    end

    context 'with placement "end"' do
      let(:placement) { 'end' }

      it 'should move cards into the to_collection at the end' do
        expect(from_collection.collection_cards).to match_array moving_cards
        card_mover.call
        expect(from_collection.reload.collection_cards).to match_array []
        expect(to_collection.reload.collection_cards.last(3)).to match_array moving_cards
      end
    end

    context 'with card_action "link"' do
      let(:card_action) { 'link' }
      let(:linking_cards) { moving_cards }

      it 'should link cards into the to_collection' do
        card_mover.call
        # original cards should still be in the from_collection
        expect(from_collection.reload.collection_cards).to match_array linking_cards
        # first card should now be a new link
        to_collection.reload
        expect(to_collection.collection_cards.first.link?).to be true
        expect(to_collection.collection_cards.first.item).to eq linking_cards.first.item
      end

      it 'should not assign any permissions' do
        expect(Roles::MassAssign).not_to receive(:new)
        card_mover.call
      end
    end

    context 'with invalid move' do
      let(:parent_collection) { create(:collection) }
      let(:parent_collection_card) { create(:collection_card, collection: parent_collection) }
      let(:to_parent_collection_card) { create(:collection_card, parent: from_collection) }
      let(:cards) { [to_parent_collection_card] }

      context 'moving inside itself' do
        let(:from_collection) do
          create(:collection, organization: organization, num_cards: 3, parent_collection_card: parent_collection_card)
        end
        let(:to_collection) do
          create(:collection, organization: organization, num_cards: 3, parent_collection_card: to_parent_collection_card)
        end

        it 'should produce errors' do
          expect(card_mover.call).to be false
          expect(card_mover.errors).to match_array ["You can't move a collection inside of itself."]
        end
      end

      context 'moving between orgs' do
        let(:from_collection) do
          create(:collection, num_cards: 3, parent_collection_card: parent_collection_card)
        end
        let(:to_collection) do
          create(:collection, num_cards: 3, parent_collection_card: to_parent_collection_card)
        end

        it 'should produce errors' do
          expect(card_mover.call).to be false
          expect(card_mover.errors).to match_array ["You can't move a collection to a different organization."]
        end
      end
    end
  end
end
