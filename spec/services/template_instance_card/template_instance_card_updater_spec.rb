require 'rails_helper'

RSpec.describe TemplateInstanceCard::TemplateInstanceCardUpdater, type: :service do
  describe '#call' do
    context 'copy card attributes' do
      let(:instance_card) { create(:collection_card) }
      let(:master_card) { create(:collection_card) }
      let(:master_template) { create(:collection, master_template: true) }
      let(:service) {
        TemplateInstanceCard::TemplateInstanceCardUpdater.new(
          instance_card: instance_card,
          master_card: master_card,
          master_template: master_template,
        )
      }

      it 'should call copy_card_attributes' do
        expect(instance_card).to receive(:copy_card_attributes!).with(
          master_card,
        )
        service.call
      end

      context 'submission box master template' do
        let(:template) { create(:collection, master_template: true) }
        let(:parent) { create(:submission_box, submission_template_id: template.id, parent_collection: template) }
        let!(:master_template) { create(:test_collection, parent_collection: parent) }

        it 'should call TemplateInstanceCard::TemplateInstanceQuestionCardUpdater' do
          expect(master_template.is_a?(Collection::TestCollection)).to be(true)
          expect(master_template.inside_a_master_template?).to be(true)
          expect_any_instance_of(TemplateInstanceCard::TemplateInstanceQuestionCardUpdater).to receive(:call)
          service.call
        end
      end

      context 'text instance card' do
        let!(:instance_card) { create(:collection_card_text) }

        it 'should call TemplateInstanceCard::TemplateInstanceTextCardUpdater' do
          expect(instance_card.item.is_a?(Item::TextItem)).to be(true)
          expect_any_instance_of(TemplateInstanceCard::TemplateInstanceTextCardUpdater).to receive(:call)
          service.call
        end
      end

      context 'duplicating question choices' do
        let(:question_item_1) { create(:question_item, :with_multiple_choice_with_choices) }
        let(:question_item_2) { create(:question_item, :with_multiple_choice_with_choices) }
        let(:question_choice) { master_card.item.question_choices.first }

        before do
          master_card.update(item: question_item_1)
          instance_card.update(item: question_item_2)
          # ensures that this choice will be duplicated
          question_choice.update(text: 'Test Choice')
          question_choice.reload
        end

        it 'should duplicate choices' do
          expect(question_choice).to receive(:duplicate!)
          service.call
          instance_card.item.reload
        end
      end
    end
  end
end
