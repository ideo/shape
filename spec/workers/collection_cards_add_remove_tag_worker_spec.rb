require 'rails_helper'
require './spec/services/collection_broadcaster_shared_setup'

RSpec.describe CollectionCardsAddRemoveTagWorker, type: :worker do
  include_context 'CollectionUpdateBroadcaster setup'

  let(:collection) { create(:collection) }
  let!(:collection_cards) { create_list(:collection_card_collection, 3, parent: collection) }
  let(:records) { collection_cards.map(&:record) }
  let(:user) { create(:user) }
  subject do
    CollectionCardsAddRemoveTagWorker.new
  end

  describe '#perform' do
    let(:action) { nil }
    let(:tag) { nil }
    let(:type) { nil }
    let(:perform) do
      subject.perform(
        collection_cards.map(&:id),
        tag,
        type,
        action,
        user.id,
      )
    end

    context 'with tag_list' do
      let!(:type) { 'tag_list' }
      let!(:tag) { 'cats' }

      context 'with the add action' do
        let!(:action) { 'add' }

        it 'adds tags to all card records' do
          perform
          records.each do |record|
            expect(record.reload.tag_list).to eq(['cats'])
          end
        end

        it 'calls collection update broadcaster' do
          expect(CollectionUpdateBroadcaster).to receive(:new).with(collection, user)
          expect(broadcaster_instance).to receive(:cards_updated).with(
            collection_cards.map(&:id),
          )
          perform
        end
      end

      context 'with the remove action' do
        let!(:action) { 'remove' }

        before do
          records.each do |record|
            record.update(tag_list: 'cats, birds')
          end
        end

        it 'removes tags on all card records' do
          perform
          records.each do |record|
            expect(record.reload.tag_list).to eq(['birds'])
          end
        end

        it 'calls collection update broadcaster' do
          expect(broadcaster_instance).to receive(:cards_updated).with(
            collection_cards.map(&:id),
          )
          perform
        end
      end

      context 'with user' do
        let!(:user_dkaplan) { create(:user, handle: 'dkaplan') }
        let!(:type) { 'user_tag_list' }
        let!(:tag) { user_dkaplan.handle }

        context 'with the add action' do
          let!(:action) { 'add' }

          it 'adds tags to all card records' do
            perform
            records.each do |record|
              expect(record.reload.user_tag_list).to eq(['dkaplan'])
            end
          end

          it 'calls collection update broadcaster' do
            expect(broadcaster_instance).to receive(:collection_updated)
            expect(broadcaster_instance).to receive(:cards_updated).with(
              collection_cards.map(&:id),
            )
            perform
          end
        end

        context 'with the remove action' do
          let(:user_tags) { %w[nlistana jschwartzman msegreto] }
          let!(:users) do
            user_tags.map do |handle|
              create(:user, handle: handle)
            end
          end
          let!(:action) { 'remove' }

          before do
            records.each do |record|
              record.update(user_tag_list: user_tags + [tag])
            end
          end

          it 'removes tags on all card records' do
            records.each do |record|
              expect(record.reload.user_tag_list).to match_array(user_tags + [tag])
            end
            expect { perform }.to change(UserTag, :count).by(-records.size)
            records.each do |record|
              expect(record.reload.user_tag_list).to match_array(user_tags)
            end
          end

          it 'calls collection update broadcaster' do
            expect(broadcaster_instance).to receive(:collection_updated)
            expect(broadcaster_instance).to receive(:cards_updated).with(
              collection_cards.map(&:id),
            )
            perform
          end
        end
      end

      context 'with topic_list' do
        let!(:type) { 'topic_list' }
        let!(:tag) { 'cats' }

        context 'with the add action' do
          let!(:action) { 'add' }

          it 'adds tags to all card records' do
            perform
            records.each do |record|
              expect(record.reload.topic_list).to eq(['cats'])
            end
          end

          it 'calls collection update broadcaster' do
            expect(broadcaster_instance).to receive(:cards_updated).with(
              collection_cards.map(&:id),
            )
            perform
          end
        end

        context 'with the remove action' do
          let!(:action) { 'remove' }

          before do
            records.each do |record|
              record.update(topic_list: 'cats, birds')
            end
          end

          it 'removes tags on all card records' do
            perform
            records.each do |record|
              expect(record.reload.topic_list).to eq(['birds'])
            end
          end

          it 'calls collection update broadcaster' do
            expect(broadcaster_instance).to receive(:cards_updated).with(
              collection_cards.map(&:id),
            )
            perform
          end
        end
      end
    end
  end
end
