require 'rails_helper'

RSpec.describe CardPinner, type: :service do
  let(:organization) { create(:organization) }
  let!(:template) { create(:collection, organization: organization, num_cards: 3) }
  let!(:to_collection) { create(:collection, organization: organization, num_cards: 3) }
  let!(:card) { template.collection_cards.second }
  let(:card_pinner) do
    CardPinner.new(
      card: card,
      template: template,
      pinning: true,
    )
  end

  before do
    template.collection_cards.each_with_index do |card, i|
      card.update(pinned: false, order: i)
    end
  end

  describe '#call' do
    context 'with card to pin' do
      it 'should move pinned card to the beginning' do
        card_pinner.call
        expect(template.collection_cards.first.pinned).to be_truthy
        expect(template.collection_cards.first.id).to equal card.id
        expect(template.collection_cards.first.order).to equal 0
      end
    end
  end
end
