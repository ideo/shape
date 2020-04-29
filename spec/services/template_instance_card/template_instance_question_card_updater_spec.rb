require 'rails_helper'

RSpec.describe TemplateInstanceCard::TemplateInstanceQuestionCardUpdater, type: :service do
  describe '#call' do
    let(:instance_card) { create(:collection_card_text) }
    let(:question_item) { create(:question_item, content: 'master_content') }
    let(:master_card) { create(:collection_card_text, item: question_item) }

    let(:service) {
      TemplateInstanceCard::TemplateInstanceQuestionCardUpdater.new(
        instance_card: instance_card, master_card: master_card,
      )
    }
    context 'with draft test collection' do
      let!(:instance_test_collection) { create(:test_collection, :open_response_questions, test_status: :draft) }
      before do
        instance_test_collection.collection_cards << instance_card
        master_card.item
      end

      it 'should copy_test_details_from_master' do
        expect(instance_card.item.content).to_not eq(master_card.item.content)
        service.call
        instance_card.reload
        expect(instance_card.item.content).to eq(master_card.item.content)
      end

      context 'with ideas collection' do
        let(:ideas_collection) { create(:collection) }
        let!(:master_card) { create(:collection_card_text, record: ideas_collection) }

        it 'should not copy_test_details_from_master' do
          expect(instance_card.item).to_not receive(:update)
          service.call
          instance_card.reload
        end
      end
    end

    context 'with live test collection' do
      let!(:instance_test_collection) { create(:test_collection, :open_response_questions, :launched) }

      it 'should not copy_test_details_from_master' do
        expect(instance_card.item.content).to_not eq(master_card.item.content)
        service.call
        instance_card.reload
        expect(instance_card.item.content).to_not eq(master_card.item.content)
      end
    end
  end
end
