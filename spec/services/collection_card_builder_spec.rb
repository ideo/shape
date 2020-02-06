require 'rails_helper'

RSpec.describe CollectionCardBuilder, type: :service do
  let(:organization) { create(:organization) }
  let(:parent) do
    create(:collection,
           organization: organization,
           add_editors: [user])
  end
  let(:user) { create(:user) }
  let(:card_type) { 'primary' }
  let(:params) do
    {
      order: 1,
      width: 3,
      height: 1,
      row: 3,
      col: 2,
    }
  end
  let(:full_params) do
    params.merge(
      collection_attributes: {
        name: 'Cool Collection',
      },
    )
  end

  describe '.call' do
    let(:options) do
      {
        params: full_params,
        parent_collection: parent,
        user: user,
        type: card_type,
      }
    end

    it 'should return the CollectionCard' do
      result = CollectionCardBuilder.call(options)
      expect(result.is_a?(CollectionCard)).to be true
    end
  end

  describe '#create' do
    context 'success creating card with collection' do
      let(:builder) do
        CollectionCardBuilder.new(
          params: full_params,
          parent_collection: parent,
          user: user,
          type: card_type,
        )
      end
      let(:collection) { builder.collection_card.collection }

      it 'should add the user as editor to the card\'s child collection' do
        expect(builder.create).to be true
        expect(collection.can_edit?(user)).to be true
      end

      it 'should anchor its roles to the parent collection' do
        expect(builder.create).to be true
        expect(collection.roles_anchor).to eq parent
      end

      it 'should increase order of additional cards' do
        expect_any_instance_of(CollectionCard).to receive(:increment_card_orders!)
        expect(builder.create).to be true
      end

      it 'should create the collection with organization inherited from parent' do
        expect(builder.create).to be true
        created_collection = collection
        # this behavior comes from collection before_validation
        expect(created_collection.organization).to eq organization
      end

      it 'should set the collections created by to current user' do
        expect(builder.create).to be true
        created_collection = collection
        expect(created_collection.created_by).to eq user
      end

      it 'should calculate the breadcrumb for the card\'s child collection' do
        expect(builder.create).to be true
        created_collection = collection
        expect(created_collection.breadcrumb).to eq [parent.id]
      end

      it 'should not give the primary group view access to the collection by default' do
        expect(builder.create).to be true
        expect(organization.primary_group.has_role?(Role::VIEWER, collection)).to be false
      end

      it 'should set user show_helper to false if it was true' do
        expect(user.show_helper).to be true
        expect(builder.create).to be true
        expect(user.show_helper).to be false
      end

      it 'should ignore the row and col values' do
        expect(builder.create).to be true
        expect(builder.collection_card.row).to eq nil
        expect(builder.collection_card.col).to eq nil
      end

      context 'with card_type == "link"' do
        let(:card_type) { 'link' }
        let!(:collection) { create(:collection, organization: organization) }
        let(:full_params) do
          params.merge(collection_id: collection.id)
        end

        it 'should create a link card' do
          expect_any_instance_of(CollectionCard).to receive(:increment_card_orders!)
          expect(builder.create).to be true
          expect(builder.collection_card.link?).to be true
          expect(builder.collection_card.collection).to eq collection
        end

        context 'with multiple ordered cards' do
          let!(:parent) do
            create(:collection,
                   num_cards: 5,
                   organization: organization,
                   add_editors: [user])
          end

          before do
            # just to simulate things being out of whack
            parent.collection_cards.last.update(order: 10)
          end

          it 'should put things in the correct order' do
            builder.create
            card = builder.collection_card
            expect(parent.reload.collection_cards.map(&:order)).to eq(
              [0, 1, 2, 3, 4, 5],
            )
            expect(card.order).to eq 1
          end
        end
      end

      describe 'creating card with collection in UserCollection' do
        let(:parent) do
          create(:user_collection, organization: organization, add_editors: [user])
        end

        it 'should give the primary group view access to the collection' do
          expect(builder.create).to be true
          expect(organization.primary_group.has_role?(Role::VIEWER, collection)).to be true
        end
      end

      describe 'creating card in a MasterTemplate' do
        let(:parent) do
          create(:collection, master_template: true, organization: organization, add_editors: [user])
        end

        it 'should create a pinned card by default' do
          expect(builder.create).to be true
          expect(builder.collection_card.pinned?).to be false
        end
      end

      context 'on a Foamcore Board' do
        let(:parent) do
          create(:board_collection,
                 organization: organization,
                 add_editors: [user])
        end

        it 'should save the row and col values' do
          expect(builder.create).to be true
          expect(builder.collection_card.row).to eq 3
          expect(builder.collection_card.col).to eq 2
        end
      end

      context 'with external_id', api_token: true do
        let(:builder) do
          CollectionCardBuilder.new(
            params: params.merge(
              collection_attributes: {
                name: 'Cool Collection',
                external_id: '99',
              },
            ),
            parent_collection: parent,
            user: @api_token.application.user,
          )
        end

        it 'should create the external_record' do
          expect do
            builder.create
          end.to change(ExternalRecord, :count).by(1)
          expect(builder.collection_card.record.external_records.last.external_id).to eq '99'
        end
      end

      context "when inside a Creative Difference collection" do
        let!(:parent) do
          create(:collection,
          organization: organization,
          add_editors: [user])
        end

        before do
          ENV['CREATIVE_DIFFERENCE_ADMINISTRATION_COLLECTION_ID'] = parent.id.to_s
          builder.create
        end

        it 'updates the font color of the card and sets the cover filter to nothing' do
          expect(builder.collection_card.filter).to eq('nothing')
          expect(builder.collection_card.font_color).to eq('#120F0E')
        end
      end

      context "when inside an application collection" do
        let(:parent) do
          create(:application_collection,
          organization: organization,
          add_editors: [user])
        end

        before { builder.create }

        it 'updates the font color of the card and sets the cover filter to nothing' do
          expect(builder.collection_card.filter).to eq('nothing')
          expect(builder.collection_card.font_color).to eq('#120F0E')
        end
      end
    end

    context 'success creating card with item' do
      let(:builder) do
        CollectionCardBuilder.new(
          params: params.merge(
            item_attributes: {
              name: 'My item name',
              content: 'My Text Content goes here',
              data_content: { ops: [] },
              type: 'Item::TextItem',
            },
          ),
          parent_collection: parent,
          user: user,
        )
      end

      it 'should calculate the breadcrumb for the card\'s child item' do
        expect(builder.create).to be true
        created_item = builder.collection_card.item
        expect(created_item.breadcrumb).to eq [parent.id]
      end

      it 'should increase order of additional cards' do
        expect_any_instance_of(CollectionCard).to receive(:increment_card_orders!)
        expect(builder.create).to be true
      end

      it 'should mark the collection as updated' do
        # parent's cover hasn't been generated so should_update_parent_collection_cover? == true
        expect_any_instance_of(Collection).to receive(:cache_cover!)
        expect(builder.create).to be true
      end

      context 'with test collections' do
        let(:test_collection) { create(:test_collection, :completed) }
        let(:parent_collection) { test_collection }
        before do
          user.add_role(Role::EDITOR, test_collection)
          test_collection.children.each do |record|
            user.add_role(Role::EDITOR, record)
          end
          allow(TestResultsCollection::CreateContentWorker).to receive(:perform_async).and_call_original
        end

        context 'when item is a scale question' do
          let(:builder) do
            CollectionCardBuilder.new(
              params: params.merge(
                section_type: :ideas,
                item_attributes: {
                  type: 'Item::QuestionItem',
                  question_type: :question_clarity,
                },
              ),
              parent_collection: parent_collection,
              user: user,
            )
          end

          context 'and test is not live' do
            it 'does not call TestResultsCollection::CreateContentWorker' do
              expect(test_collection.live?).to be false
              expect(TestResultsCollection::CreateContentWorker).not_to receive(:perform_async)
              builder.create
            end
          end

          context 'and test is live' do
            before do
              test_collection.launch!(initiated_by: user)
            end

            it 'calls TestResultsCollection::CreateContentWorker' do
              expect(test_collection.live?).to be true
              expect(TestResultsCollection::CreateContentWorker).to receive(:perform_async).with(
                test_collection.test_results_collection.id, user.id
              )
              builder.create
            end
          end
        end

        context 'when item is an open response question' do
          let(:builder) do
            CollectionCardBuilder.new(
              params: params.merge(
                section_type: :ideas,
                item_attributes: {
                  type: 'Item::QuestionItem',
                  question_type: :question_open,
                  content: 'What do you think?',
                },
              ),
              parent_collection: test_collection,
              user: user,
            )
          end

          context 'and test is not live' do
            it 'does not not call TestResultsCollection::CreateContentWorker' do
              expect(test_collection.live?).to be false
              expect(TestResultsCollection::CreateContentWorker).not_to receive(:perform_async)
              builder.create
            end
          end

          context 'and test is live' do
            before do
              test_collection.launch!(initiated_by: user)
            end

            it 'calls TestResultsCollection::CreateContentWorker' do
              expect(test_collection.live?).to be true
              expect(TestResultsCollection::CreateContentWorker).to receive(:perform_async).with(
                test_collection.test_results_collection.id, user.id
              )
              builder.create
            end
          end
        end
      end

      context 'when item is a submission' do
        let(:editor) { create(:user) }
        let(:submission_box) do
          create(:submission_box,
                 organization: organization,
                 add_editors: [editor],
                 add_viewers: [user])
        end
        let(:parent) { create(:submissions_collection, submission_box: submission_box) }
        let!(:comment_thread) { create(:collection_comment_thread, record: submission_box) }

        before do
          builder.create
        end

        it 'should subscribe the submitter to the submission box' do
          users_thread = comment_thread.users_thread_for(user)
          expect(users_thread.subscribed).to be true
        end

        it 'should add the submitter as an editor' do
          record = builder.collection_card.record
          expect(record.can_edit?(editor)).to be true
          expect(record.can_edit?(user)).to be true
        end
      end

      context 'when item is a data item' do
        context 'and there are data_items_datasets_attributes in params' do
          let(:datasets) { create_list(:dataset, 2, :with_cached_data) }
          let(:builder) do
            CollectionCardBuilder.new(
              params: params.merge(
                item_attributes: {
                  type: 'Item::DataItem',
                  report_type: 'report_type_collections_and_items',
                  data_items_datasets_attributes: {
                    0 => {
                      order: 0,
                      selected: true,
                      dataset_id: datasets[0].id,
                    },
                    1 => {
                      order: 1,
                      selected: false,
                      dataset_id: datasets[1].id,
                    },
                  },
                },
              ),
              parent_collection: parent,
              user: user,
            )
          end

          it 'links datasets' do
            expect {
              builder.create
            }.to change(DataItemsDataset, :count).by(2)

            item = builder.collection_card.item

            expect(item.datasets.count).to eq 2
            expect(item.datasets.first).to eq datasets[0]
            expect(item.datasets.last).to eq datasets[1]
          end
        end

        context 'and there are datasets_attributes in params' do
          let(:builder) do
            CollectionCardBuilder.new(
              params: params.merge(
                item_attributes: {
                  type: 'Item::DataItem',
                  report_type: 'report_type_collections_and_items',
                  datasets_attributes: {
                    0 => {
                      chart_type: 'area',
                      measure: 'participants',
                      timeframe: 'ever',
                      type: 'Dataset::CollectionsAndItems',
                    },
                    1 => {
                      chart_type: 'line',
                      measure: 'viewers',
                      timeframe: 'ever',
                      type: 'Dataset::CollectionsAndItems',
                    },
                  },
                },
              ),
              parent_collection: parent,
              user: user,
            )
          end

          before do
            builder.create
          end

          it 'creates datasets' do
            item = builder.collection_card.item

            expect(item.datasets.count).to eq 2
            expect(item.datasets.first.measure).to eq 'participants'
            expect(item.datasets.last.measure).to eq 'viewers'
          end
        end
      end
    end

    context 'error because the item has no type' do
      # attempt to build card without any item or collection
      let(:builder) do
        CollectionCardBuilder.new(
          params: params.merge(
            item_attributes: {
              name: 'My item name',
              content: 'My Text Content goes here',
            },
          ),
          parent_collection: parent,
          user: user,
        )
      end

      it 'should display errors' do
        expect(builder.create).to be false
        expect(builder.errors.full_messages.first).to eq "Item type can't be blank"
      end

      it 'should not increase order of additional cards' do
        expect_any_instance_of(CollectionCard).not_to receive(:increment_card_orders!)
        expect(builder.create).to be false
      end
    end

    context 'error because there is no related record' do
      # attempt to build card without any item or collection
      let(:builder) do
        CollectionCardBuilder.new(
          params: params,
          parent_collection: parent,
          user: user,
        )
      end

      before do
        expect(builder.create).to be false
      end

      it 'should display errors' do
        expect(builder.errors.full_messages.first).to eq "Record can't be blank"
      end
    end

    context 'error when trying to create both related records' do
      # attempt to build card without any item or collection
      let(:builder) do
        CollectionCardBuilder.new(
          params: params.merge(
            collection_attributes: {
              name: 'Test',
            },
            item_attributes: {
              content: 'Test Content',
              type: 'Item::TextItem',
              data_content: 'xyz',
            },
          ),
          parent_collection: parent,
          user: user,
        )
      end

      before do
        expect(builder.create).to be false
      end

      it 'should display errors' do
        expect(builder.errors.full_messages.first).to eq 'Only one of Item or Collection can be assigned'
      end
    end

    context 'creating an overlapping card on foamcore' do
      let(:parent) do
        create(:board_collection,
               organization: organization,
               add_editors: [user])
      end
      let!(:overlapping_card) { create(:collection_card_text, row: 1, col: 1, parent: parent) }
      let(:builder) do
        CollectionCardBuilder.new(
          params: params.merge(
            item_attributes: {
              name: 'My item name',
              content: 'My Text Content goes here',
              data_content: { ops: [] },
              type: 'Item::TextItem',
            },
            row: 1,
            col: 1,
          ),
          parent_collection: parent,
          user: user,
        )
      end

      it 'should create the card in an open spot' do
        expect(builder.create).to be true
        card = builder.collection_card
        expect(card.row).to eq 1
        # should put it in the next column over
        expect(card.col).to eq 2
      end
    end
  end
end
