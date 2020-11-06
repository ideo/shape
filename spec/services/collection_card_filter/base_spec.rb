require 'rails_helper'
require_relative 'shared_setup'

RSpec.describe CollectionCardFilter::Base, type: :service do
  describe '#call' do
    include_context 'CollectionCardFilter setup'
    subject do
      CollectionCardFilter::Base.call(
        collection: collection,
        user: user,
        filters: filters,
        application: application,
        ids_only: ids_only,
        select_ids: select_ids,
      )
    end

    context 'as a viewer' do
      let!(:user) { viewer }

      it 'returns all non-hidden cards' do
        expect(subject).to match_array(visible_cards)
      end

      context 'non-board collection' do
        let!(:filters) do
          {
            page: 2,
          }
        end

        before do
          # e.g. a test collection
          collection.update(num_columns: nil)
        end

        it 'filters by given page/per_page' do
          # Default per_page is made to be at least 50,
          # so best way to test is to make sure we didn't receive any cards -- though not ideal
          expect(subject).to be_empty
        end
      end

      context 'with card_order filters' do
        context 'card_order = updated_at' do
          let(:filters) { { card_order: 'updated_at' } }

          before do
            visible_cards.each_with_index do |c, i|
              c.update(updated_at: Time.current - i.minutes)
            end
          end

          it 'should return results sorted by updated_at' do
            sorted = visible_cards.sort_by(&:updated_at).reverse
            viewable = subject

            expect(viewable.first).to eq(sorted.first)
            expect(viewable.last).to eq(sorted.last)
          end

          context 'and a filter query' do
            let(:filters) { { card_order: 'updated_at', q: 'plant' } }

            before do
              visible_card_1.record.update(
                name: 'a plant',
              )
              Collection.reindex
              Collection.searchkick_index.refresh
            end

            it 'should only return the cards that match the filter query' do
              expect(subject).to match_array(
                [visible_card_1],
              )
            end
          end
        end

        context 'card_order by test score' do
          let(:filters) { { card_order: 'question_useful' } }
          it 'should return results according to the cached_test_scores sorting param' do
            scored1 = collection.collections.first
            scored1.update(cached_test_scores: { 'question_useful' => 30 })
            scored2 = collection.collections.last
            scored2.update(cached_test_scores: { 'question_useful' => 20 })

            viewable = subject
            expect(viewable.first).to eq(scored1.parent_collection_card)
            expect(viewable.second).to eq(scored2.parent_collection_card)
          end
        end
      end

      context 'with board collection' do
        before do
          collection.update(num_columns: 4)

          cards.each_with_index do |card, i|
            card.update(
              row: 1,
              col: i + 1,
            )
          end
        end
        let!(:filters) do
          {
            rows: [0, 1],
            cols: [2, 3],
          }
        end

        it 'filters by row/col' do
          # Must re-instantiate subject so we can cast board to right class
          cc_filter = CollectionCardFilter::Base.call(
            collection: collection,
            user: user,
            filters: filters,
          )
          expect(cc_filter).to eq(
            [
              visible_card_2,
            ],
          )
        end
      end

      context 'with an archived collection' do
        before do
          collection.reload.archive!
          # put this card in a different batch
          visible_card_2.update(archive_batch: 'xyz')
        end

        it 'should return all cards archived in the same batch as parent' do
          expect(subject).to match_array(
            [visible_card_1, private_card],
          )
        end
      end

      context 'hidden true' do
        let!(:filters) { { hidden: true } }

        it 'returns all cards user has permission to see' do
          expect(subject).to match_array(
            visible_cards + [hidden_card],
          )
        end
      end

      context 'with a filter query' do
        let!(:filters) { { q: 'plant', page: 1 } }

        before do
          visible_card_1.record.update(
            name: 'a plant',
          )
          Collection.reindex
          Collection.searchkick_index.refresh
        end

        it 'should only return the cards that match the filter query' do
          expect(subject).to match_array(
            [visible_card_1],
          )
        end
      end

      context 'with ids_only setting' do
        let(:ids_only) { true }

        it 'returns id, order, row, col of all visible cards' do
          data = visible_cards.map do |cc|
            {
              id: cc.id.to_s,
              order: cc.order,
              row: cc.row,
              col: cc.col,
              height: cc.height,
              width: cc.width,
            }
          end
          subject

          expect(subject).to match_array(data)
        end
      end

      context 'with select_ids setting' do
        let(:select_ids) { [visible_card_1.id] }

        it 'limits selection to the selected card id' do
          expect(subject).to match_array(
            [visible_card_1],
          )
        end

        context 'with invalid card ids' do
          let(:other_card) { create(:collection_card_text) }
          let(:select_ids) { [visible_card_1.id, other_card.id] }

          it 'ignores card ids from other collections' do
            expect(subject).to match_array(
              [visible_card_1],
            )
          end
        end
      end
    end

    context 'as an editor' do
      let!(:user) { editor }

      it 'returns all non-hidden cards' do
        expect(subject).to match_array(
          visible_cards,
        )
      end
    end

    context 'as a super admin' do
      let!(:user) { super_admin }

      it 'returns all public or private, non-hidden cards' do
        expect(subject).to match_array(
          visible_cards,
        )
      end

      context 'hidden true' do
        let!(:filters) { { hidden: true } }

        it 'returns all cards' do
          expect(subject).to match_array(
            visible_cards + [hidden_card],
          )
        end
      end
    end

    context 'with no user' do
      it 'returns no visible cards' do
        expect(subject).to match_array([])
      end

      context 'anyone_can_view' do
        before do
          collection.update(anyone_can_view: true)
        end

        it 'returns all cards with same role as collection' do
          expect(subject).to match_array(
            [visible_card_1, visible_card_2],
          )
        end
      end
    end

    context 'with common resource group' do
      let(:common_resource_group) { create(:global_group, :common_resource) }
      let(:user) { create(:user) }

      before do
        common_resource_group.add_role(Role::VIEWER, collection)
      end

      it 'returns all cards that common resource group can view' do
        expect(subject).to match_array(visible_cards)
      end
    end

    context 'with external_id filter' do
      let!(:application) { create(:application) }
      let(:user) { create(:user, :application_bot, application: application) }
      let!(:external_record) do
        create(
          :external_record,
          external_id: 'creative-difference-card',
          externalizable: visible_card_2.record,
          application: application,
        )
      end
      let!(:filters) do
        { external_id: 'creative-difference-card' }
      end
      before do
        # make sure application_bot can view the collection
        user.add_role(Role::VIEWER, collection)
      end

      it 'returns card that has collection with external id' do
        expect(subject).to match_array(
          [visible_card_2],
        )
      end
    end
  end
end
