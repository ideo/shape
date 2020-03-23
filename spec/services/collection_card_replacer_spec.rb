require 'rails_helper'

RSpec.describe CollectionCardReplacer, type: :service do
  let(:user) { create(:user) }
  let(:parent) do
    create(:collection, num_cards: 2)
  end
  let(:params) do
    {
      item_attributes: {
        type: 'Item::LinkItem',
        url: 'http://item.link.url.net/123',
        name: 'A linkable linked article',
        content: 'Some text that would go inside, lorem ipsum.',
        icon_url: 'http://icon.url',
      },
    }
  end
  let(:builder) do
    CollectionCardReplacer.new(
      replacing_card: collection_card,
      params: params,
    )
  end

  describe '#replace' do
    context 'error trying to replace a non-item card' do
      let(:collection_card) do
        create(:collection_card_collection, parent: parent)
      end

      it 'should return an error about requiring an item' do
        expect(builder.replace).to be false
        expect(builder.errors.full_messages).to eq ["Item can't be blank"]
      end
    end

    context 'successfully replacing a card\'s item' do
      # will be a text card by default, even though this is technically not a replaceable type
      let(:collection_card) { parent.collection_cards.first }
      let(:item) { collection_card.item }

      before do
        item.unanchor_and_inherit_roles_from_anchor!
        user.add_role(Role::EDITOR, item)
      end

      # NOTE: these tests very similar to collection_cards_controller#replace
      it 'updates the existing item with the new type' do
        expect(item.is_a?(Item::TextItem)).to be true
        expect(item.data_content.present?).to be true
        expect do
          builder.replace
        end.not_to change(Item, :count)
        # have to refetch since it's now a new model type
        id = item.id
        item = Item.find(id)
        expect(item.is_a?(Item::LinkItem)).to be true
        # should clear any previous attrs
        expect(item.data_content.present?).to be false
      end

      it 'preserves the roles' do
        expect(item.can_edit?(user)).to be true
        builder.replace
        expect(item.can_edit?(user)).to be true
      end

      context 'with anchored roles' do
        before do
          user.add_role(Role::VIEWER, parent)
          parent.reset_permissions!
          item.reload
        end

        it 'preserves the anchored roles' do
          expect(item.roles).to be_empty
          expect(item.can_view?(user)).to be true
          builder.replace
          expect(item.can_view?(user)).to be true
        end
      end

      # need to seed to get audiences
      context 'with test collections', seed: true do
        let(:test_collection) { create(:test_collection, :completed) }
        let(:replacing_card) { test_collection.collection_cards.where(section_type: :ideas).last }
        before do
          user.add_role(Role::EDITOR, test_collection)
          test_collection.children.each do |record|
            user.add_role(Role::EDITOR, record)
          end
          allow(TestResultsCollection::CreateContentWorker).to receive(:perform_async).and_call_original
        end

        context 'when item is a scale question' do
          let(:builder) do
            CollectionCardReplacer.new(
              params: {
                section_type: :ideas,
                item_attributes: {
                  type: 'Item::QuestionItem',
                  question_type: :question_clarity,
                },
              },
              replacing_card: replacing_card,
            )
          end

          context 'and test is not live' do
            it 'does not call TestResultsCollection::CreateContentWorker' do
              expect(test_collection.live?).to be false
              expect(TestResultsCollection::CreateContentWorker).not_to receive(:perform_async)
              builder.replace
            end
          end

          context 'and test is live' do
            before do
              test_collection.launch!(initiated_by: user)
            end

            it 'calls TestResultsCollection::CreateContentWorker' do
              expect(test_collection.live?).to be true
              expect(TestResultsCollection::CreateContentWorker).to receive(:perform_async).with(
                test_collection.test_results_collection.id,
                nil,
                replacing_card.id,
              )
              builder.replace
            end
          end
        end

        context 'when item is an open response question' do
          let(:builder) do
            CollectionCardReplacer.new(
              params: {
                section_type: :ideas,
                item_attributes: {
                  type: 'Item::QuestionItem',
                  question_type: :question_open,
                  content: 'What do you think?',
                },
              },
              replacing_card: test_collection.collection_cards.where(section_type: :ideas).last,
            )
          end

          context 'and test is not live' do
            it 'does not not call TestResultsCollection::CreateContentWorker' do
              expect(test_collection.live?).to be false
              expect(TestResultsCollection::CreateContentWorker).not_to receive(:perform_async)
              builder.replace
            end
          end

          context 'and test is live' do
            before do
              test_collection.launch!(initiated_by: user)
            end

            it 'calls TestResultsCollection::CreateContentWorker' do
              expect(test_collection.live?).to be true
              expect(TestResultsCollection::CreateContentWorker).to receive(:perform_async).with(
                test_collection.test_results_collection.id,
                nil,
                replacing_card.id,
              )
              builder.replace
            end
          end
        end
      end

      context 'with filestack_file_attributes' do
        let(:new_image_url) { 'https://process.filestackapi.com/AKbadkt4jRcKqMsj60Izaz/resize=width:1200,fit:max/rotate=deg:exif/wvW29dKNT8q4kpa6NrTK' }
        let(:params) do
          {
            item_attributes: {
              type: 'Item::FileItem',
              filestack_file_attributes: {
                url: new_image_url,
                handle: 'wvW29dKNT8q4kpa6NrTK',
                filename: 'Elephant_statue_in_Butterfly_Park.jpg',
                size: 6_812_242,
                mimetype: 'image/jpeg',
              },
            },
          }
        end

        it 'should create a new filestack file for the item' do
          expect(item.filestack_file_id).to be nil
          expect do
            builder.replace
          end.to change(FilestackFile, :count).by(1)
          expect(item.filestack_file_id).to eq FilestackFile.last.id
          # have to refetch since it's now a new model type
          id = item.id
          item = Item.find(id)
          expect(item.is_a?(Item::FileItem)).to be true
          # should clear any previous attrs
          expect(item.data_content.present?).to be false
        end

        context 'with collection cover' do
          let(:collection_card) do
            create(:collection_card_image, parent: parent)
          end

          before do
            parent.cache_cover!
          end

          it 'should update the cover if needed' do
            expect(parent.cached_cover['image_url']).to eq item.image_url
            builder.replace
            expect(item.image_url).to eq new_image_url
            expect(parent.cached_cover['image_url']).to eq new_image_url
          end
        end
      end
    end
  end
end
