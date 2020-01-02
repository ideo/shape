require 'rails_helper'

RSpec.describe CardPinner, type: :service do
  let(:organization) { create(:organization) }
  let!(:pin_cards) { false }
  let(:template) { create(:collection, organization: organization, num_cards: 3, pin_cards: pin_cards) }
  let(:to_collection) { create(:collection, organization: organization, num_cards: 3) }
  let!(:card_to_pin) { template.collection_cards.second }
  let!(:pinning) { true }
  let(:card_pinner) do
    CardPinner.new(
      card: card_to_pin,
      pinning: pinning,
    )
  end

  describe '#call' do
    context 'with card to pin' do
      it 'should move pinned card to the beginning' do
        card_pinner.call
        expect(template.collection_cards.pinned).not_to be_empty
        expect(card_to_pin.reload.order).to eql(0)
      end

      context 'with card to pin along already pinned cards' do
        before do
          template.collection_cards.first.update(pinned: true)
        end

        it 'should move pinned card to the end of the pinned cards' do
          card_pinner.call
          expect(template.collection_cards.pluck(:order, :pinned)).to eql(
            [[0, true], [1, true], [2, false]],
          )
        end
      end
    end

    context 'with card to unpin' do
      let!(:pin_cards) { true }
      let!(:card_to_pin) { template.collection_cards.first }
      let!(:pinning) { false }

      it 'should move unpinned card to the beginning of the unpinned cards' do
        expect {
          card_pinner.call
        }.to change(card_to_pin, :order)
        expect(template.collection_cards.unpinned).not_to be_empty
        expect(template.collection_cards.unpinned.first.id).to equal card_to_pin.id
      end
    end
  end
end
