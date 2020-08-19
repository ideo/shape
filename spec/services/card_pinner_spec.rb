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
      it 'should pin the card' do
        expect {
          card_pinner.call
        }.to change(card_to_pin, :pinned)
      end

      it 'should call queue_update_template_instances' do
        expect_any_instance_of(Collection).to receive(:queue_update_template_instances).with(
          updated_card_ids: [card_to_pin.id],
          template_update_action: :pin,
        )
        card_pinner.call
      end
    end
  end
end
