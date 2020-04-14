require 'rails_helper'

RSpec.describe TemplateInstanceCard::TemplateInstanceTextCardUpdater, type: :service do
  describe '#call' do
    context 'copying data content from master when' do
      let(:instance_card) { create(:collection_card_text) }
      let(:master_card) { create(:collection_card_text) }
      let(:service) {
        TemplateInstanceCard::TemplateInstanceTextCardUpdater.new(
          instance_card: instance_card, master_card: master_card,
        )
      }
      let(:data_content) {
        Mashie.new(ops: [{ insert: 'hello!' }])
      }

      context 'when master text item version is higher than the instance' do
        before do
          master_card.item.quill_data = data_content
          master_card.item.save
        end

        it 'copy_data_content_from_master' do
          expect(instance_card.item.version).to_not eq(master_card.item.version)
          service.call
          master_card.item.reload
          instance_card.item.reload
          expect(instance_card.item.data_content['ops']).to eq(master_card.item.data_content['ops'])
          expect(instance_card.item.version).to eq(master_card.item.version)
        end

        context 'when the instance card has already been edited' do
          let(:activity) { create(:activity, action: :edited) }

          before do
            instance_card.item.activities = [activity]
            instance_card.item.save
          end

          it 'does not copy_data_content_from_master' do
            expect(instance_card.item.version).to_not eq(master_card.item.version)
            service.call
            master_card.item.reload
            instance_card.item.reload
            expect(instance_card.item.data_content['ops']).to_not eq(master_card.item.data_content['ops'])
            expect(instance_card.item.version).to_not eq(master_card.item.version)
          end
        end
      end

      context 'when master text item version is lower than the instance' do
        before do
          instance_card.item.quill_data = data_content
          instance_card.item.save
        end

        it 'does not copy_data_content_from_master' do
          expect(instance_card.item.version).to_not eq(master_card.item.version)
          service.call
          master_card.item.reload
          instance_card.item.reload
          expect(instance_card.item.data_content['ops']).to_not eq(master_card.item.data_content['ops'])
          expect(instance_card.item.version).to_not eq(master_card.item.version)
        end
      end
    end
  end
end
