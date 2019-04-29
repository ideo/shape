require 'rails_helper'

RSpec.describe CollectionCardFilter, type: :service do
  describe '#viewable_by' do
    let(:editor) { create(:user) }
    let(:viewer) { create(:user) }
    let(:super_admin) do
      user = create(:user)
      user.add_role(Role::SUPER_ADMIN)
      user
    end
    let(:organization) { create(:organization) }
    let!(:collection) do
      create(:collection,
             organization: organization,
             num_cards: 3,
             record_type: :collection)
    end

    let(:card_order) { nil }
    let(:hidden) { nil }
    let!(:visible_card) do
      # Start with all cards anchored to the parent
      cards[0].record.update(roles_anchor_collection: collection)
    end
    let!(:hidden_card) do
      cards[1].update(hidden: true)
      cards[1]
    end
    let!(:private_card) do
      cards[2].record.cached_inheritance = { private: true, updated_at: Time.current }
      cards[2].record.save
      cards[2]
    end
    before do
      collection.add_role(Role::EDITOR, editor)
      collection.add_role(Role::VIEWER, viewer)
      cards.each do |card|
        card.record.add_role(Role::EDITOR, editor)
        card.record.add_role(Role::EDITOR, viewer)
      end
    end
    subject do
      CollectionCardFilter.call(
        user: user,
        card_order: card_order,
        hidden: hidden,
      )
    end

    context 'as a viewer' do
      let!(:user) { viewer }

      it 'returns all non-hidden cards' do
        expect(subject).to match_array(
          [visible_card],
        )
      end

      context 'hidden true' do
        let!(:hidden) { true }

        it 'returns all cards user has permission to see' do
          expect(subject).to match_array(
            [visible_card, hidden_card],
          )
        end
      end
    end

    context 'as an editor' do
      let!(:user) { editor }

      it 'returns all non-hidden cards' do
        expect(subject).to match_array(
          [visible_card],
        )
      end
    end

    context 'as a super admin' do
      let!(:user) { super_admin }

      it 'returns all public and private cards' do
        expect(subject).to match_array(
          [visible_card, hidden_card, private_card],
        )
      end
    end

    context 'as a guest' do
      it 'returns all cards with same role as collection' do
        expect(subject).to match_array(
          [visible_card],
        )
      end
    end
  end
end
