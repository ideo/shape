require 'rails_helper'

RSpec.describe CardDuplicatorMapper::Base, type: :service do
  let(:batch_id) { SecureRandom.hex(10) }
  subject do
    CardDuplicatorMapper::Base.new(batch_id: batch_id)
  end

  context 'registering duplicated cards' do
    let(:remapper_instance) { double('remapper') }

    before do
      # Stub out so that it doesn't clear cards
      allow(CardDuplicatorMapper::RemapLinkedCards).to receive(:new).and_return(remapper_instance)
      allow(remapper_instance).to receive(:remap_cards)
      allow(remapper_instance).to receive(:call)
    end

    it 'stores card ids' do
      subject.register_duplicated_card(
        original_card_id: '123',
        to_card_id: '456',
      )
      expect(subject.duplicated_cards).to eq(
        '123' => '456',
      )
      expect(subject.duplicated_card_ids).to eq(['123'])
    end

    it 'calls RemapLinkedCards if all cards mapped' do
      expect(CardDuplicatorMapper::RemapLinkedCards).to receive(:new).with(
        batch_id: batch_id,
      )
      # should call the individual remap method
      expect(remapper_instance).to receive(:remap_cards).with(
        '123',
        '456',
      )
      # and `call` when `all_cards_mapped?`
      expect(remapper_instance).to receive(:call)
      subject.register_duplicated_card(
        original_card_id: '123',
        to_card_id: '456',
      )
      subject.register_linked_card(
        card_id: '123',
        data: { type: :link_item },
      )
      expect(subject.all_cards_mapped?).to be true
    end
  end

  context 'registering linked cards' do
    before do
      subject.register_linked_card(
        card_id: '789',
        data: { type: :link_item },
      )
    end

    it 'stores card data' do
      expect(subject.linked_cards).to eq(
        '789' => { 'type' => 'link_item' },
      )
      expect(subject.linked_card_ids).to eq(['789'])
      expect(subject.linked_card?(card_id: '789')).to be true
    end
  end
end
