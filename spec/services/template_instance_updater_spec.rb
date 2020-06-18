require 'rails_helper'
require './spec/services/collection_broadcaster_shared_setup'

RSpec.describe TemplateInstanceUpdater, type: :service do
  include_context 'CollectionUpdateBroadcaster setup'
  let(:template_admin) { create(:user) }
  let(:user) { create(:user) }
  let(:template_instance_updater) {
    TemplateInstanceUpdater.new(
      master_template: template,
      updated_card_ids: updated_card_ids,
      template_update_action: template_update_action,
    )
  }
  describe '#call' do
    let!(:template) {
      create(:collection,
             master_template: true,
             num_cards: 3,
             pin_cards: true,
             created_by: template_admin,
             add_editors: [template_admin])
    }
    let(:organization) { template.organization }
    let(:updated_card_ids) { template.collection_cards.pluck(:id) }
    let!(:template_instance) { create(:collection, template: template, created_by: user, organization: organization) }
    let(:template_update_action) { :create }

    context 'calling template_instance_updater with \'create\' template_update_action' do
      it 'should copy the template\'s pinned cards into the templated collections' do
        template_instance_updater.call
        expect(template_instance.collection_cards.count).to eq(3)
        expect(template_instance.collection_cards.pluck(:templated_from_id)).to match_array(
          template.collection_cards.pluck(:id),
        )
      end
    end

    context 'with string action (e.g. when called via worker)' do
      let(:template_update_action) { 'create' }

      it 'should still call the correct action' do
        expect {
          template_instance_updater.call
        }.to change(template_instance.collection_cards, :count).by(3)
      end
    end

    context 'calling template_instance_updater with \'update_all\' template_update_action' do
      let!(:updated_card_ids) { template.collection_cards.pluck(:id) }
      let(:template_update_action) { :update_all }
      before do
        template.setup_templated_collection(
          for_user: user,
          collection: template_instance,
          synchronous: :first_level,
        )
      end

      it 'should update all pinned cards to match any height, width and order updates' do
        # Update master cards height, width and order
        first_template_card = template.collection_cards.find_by_id(updated_card_ids[0])
        second_template_card = template.collection_cards.find_by_id(updated_card_ids[1])
        # fake bumping all cards to the end
        template.collection_cards.update_all(order: 100)
        template.update(
          collection_cards_attributes: [
            { id: first_template_card.id, height: 2, width: 2, order: 1 },
            { id: second_template_card.id, order: 0 },
          ],
        )
        # now first and second should be swapped, all other cards should get reordered after
        template.reorder_cards!
        # Update instances
        template_instance_updater.call
        template_instance.reload
        template.collection_cards.reload

        # Instance cards should reflect the updates, and be in the updated order
        expect(template_instance.collection_cards[0].height).to eq(1)
        expect(template_instance.collection_cards[0].width).to eq(1)
        expect(template_instance.collection_cards[0].templated_from_id).to eq(
          second_template_card.id,
        )
        expect(template_instance.collection_cards[1].height).to eq(2)
        expect(template_instance.collection_cards[1].width).to eq(2)
        expect(template_instance.collection_cards[1].templated_from_id).to eq(
          first_template_card.id,
        )
      end

      it 'should not broadcast updates unless there are realtime viewers present' do
        expect(CollectionUpdateBroadcaster).not_to receive(:new).with(template_instance)
        template_instance_updater.call
      end

      context 'with realtime viewers' do
        it 'should call CollectionUpdateBroadcaster on templated_collections' do
          template_instance.started_viewing(user)
          expect(CollectionUpdateBroadcaster).to receive(:new).with(template_instance)
          expect(broadcaster_instance).to receive(:reload_cards)
          template_instance_updater.call
        end
      end

      context 'with updated text card from master template' do
        let!(:template) do
          create(:collection,
                 master_template: true,
                 num_cards: 1,
                 pin_cards: true,
                 created_by: template_admin,
                 add_editors: [template_admin])
        end
        let(:organization) { create(:organization) }
        let(:parent_collection) { create(:collection, organization: organization) }
        let!(:template_instance) { create(:collection, template: template, created_by: user, parent_collection: parent_collection) }
        let(:template_text_item) { template.collection_cards.first.item }
        let(:instance_text_item) { template_instance.collection_cards.first.item }
        let!(:activity) { create(:activity, actor: user, action: :edited) }
        let(:data) do
          Mashie.new(
            delta: { ops: [{ insert: 'hi' }] },
            version: 1,
            full_content: { ops: [{ insert: 'hello hi' }] },
          )
        end

        it 'should update instance text item data_content when it has no edit activity' do
          template_text_item.transform_realtime_delta(user: user,
                                                      delta: data.delta,
                                                      version: data.version,
                                                      full_content: data.full_content)
          template_instance_updater.call
          expect(instance_text_item.data_content['ops']).to eq(template_text_item.data_content['ops'])
        end

        it 'should update instance text item data_content when it\'s version is <= its template text item' do
          template_text_item.transform_realtime_delta(user: user,
                                                      delta: data.delta,
                                                      version: data.version,
                                                      full_content: data.full_content)
          template_instance_updater.call
          expect(instance_text_item.data_content['ops']).to eq(template_text_item.data_content['ops'])
          expect(instance_text_item.version).to eq(template_text_item.version)
        end

        it 'should not update instance text item data_content when it has an edit activity' do
          instance_text_item.activities << activity
          template_text_item.transform_realtime_delta(user: user,
                                                      delta: data.delta,
                                                      version: data.version,
                                                      full_content: data.full_content)
          template_instance_updater.call
          expect(instance_text_item.data_content['ops']).not_to eq(template_text_item.data_content['ops'])
        end

        it 'should not update instance text item data_content when it\'s version is > its template text item' do
          instance_text_item.update(version: 10)
          template_text_item.transform_realtime_delta(user: user,
                                                      delta: data.delta,
                                                      version: data.version,
                                                      full_content: data.full_content)
          template_instance_updater.call
          expect(instance_text_item.data_content['ops']).not_to eq(template_text_item.data_content['ops'])
        end
      end
    end

    context 'calling template_instance_updater with \'archive\' template_update_action' do
      let(:card_to_delete) do
        template.collection_cards.first
      end
      let(:updated_card_ids) do
        [card_to_delete.id]
      end
      let(:deleted_from_template) { template_instance.collections.find_by(name: 'Deleted From Template') }
      let(:template_update_action) { :archive }

      before do
        template.setup_templated_collection(
          for_user: user,
          collection: template_instance,
          synchronous: :first_level,
        )
        card_to_delete.archive!
      end

      it 'should move deleted cards into Deleted From Template collection' do
        template_instance_updater.call
        expect(deleted_from_template.children.size).to eq(1)
        expect(
          deleted_from_template.collection_cards.first.templated_from_id,
        ).to eq(card_to_delete.id)
        expect(deleted_from_template.collection_cards.map(&:pinned).uniq).to eq([false])
        # Places it at the end of the collection
        expect(template_instance.collection_cards.last).to eq(deleted_from_template.parent_collection_card)
      end

      it 'notifies all editors that card has been moved' do
        expect {
          template_instance_updater.call
        }.to change(Activity, :count).by(1)
        deleted_item_in_instance = deleted_from_template.items.where(
          cloned_from_id: card_to_delete.record.id,
        ).first
        expect(
          Activity.where(
            action: :archived_from_template,
            organization_id: template_instance.organization_id,
            actor_id: template_admin.id,
            target_id: template_instance.id,
            target_type: 'Collection',
            source_id: deleted_item_in_instance.id,
            source_type: 'Item',
          ).count,
        ).to eq(1)
      end
    end

    context 'with a foamcore board' do
      let!(:template) {
        create(:board_collection,
               master_template: true,
               num_columns: 4,
               num_cards: 3,
               pin_cards: true,
               created_by: template_admin,
               add_editors: [template_admin])
      }
      let!(:template_instance) do
        create(:board_collection,
               num_columns: 4,
               template: template,
               created_by: user,
               organization: organization)
      end

      context 'with only pinned cards' do
        it 'does not call CollectionGrid::BoardPlacement' do
          expect(CollectionGrid::BoardPlacement).not_to receive(:call)
          template_instance_updater.call
        end
      end

      context 'with unpinned cards' do
        let!(:unpinned_master_card) do
          create(:collection_card_text, parent: template, row: 2, col: 0, pinned: false)
        end

        it 'calls CollectionGrid::BoardPlacement to reposition unpinned cards' do
          expect(CollectionGrid::BoardPlacement).to receive(:call).with(
            to_collection: template_instance,
            moving_cards: template_instance.collection_cards.where(pinned: false),
            row: unpinned_master_card.row,
            col: unpinned_master_card.col,
          )
          template_instance_updater.call
        end
      end
    end

    context 'unarchiving a template card' do
      let(:card_to_unarchive) do
        template.collection_cards.first
      end
      let(:updated_card_ids) do
        [card_to_unarchive.id]
      end
      let(:deleted_from_template) do
        create(:collection, name: 'Deleted From Template', parent_collection: template_instance, organization: organization)
      end
      let(:template_update_action) { :unarchive }

      before do
        template.setup_templated_collection(
          for_user: user,
          collection: template_instance,
          synchronous: :first_level,
        )
        # move this into Deleted From Template, so that we can see that it comes back out
        template_instance.collection_cards.find_by(templated_from_id: card_to_unarchive.id).update(parent: deleted_from_template)
        deleted_from_template.reload
      end

      it 'should move deleted cards from Deleted From Template back into the instance' do
        expect(deleted_from_template.children.size).to eq(1)
        template_instance_updater.call
        expect(deleted_from_template.reload.children.size).to eq(0)
      end
    end
  end
end
