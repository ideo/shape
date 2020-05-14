require 'rails_helper'
require './spec/services/collection_broadcaster_shared_setup'

RSpec.describe Item::TextItem, type: :model do
  include_context 'CollectionUpdateBroadcaster setup'

  context 'callbacks' do
    describe '#set_default_version' do
      let(:item) { build(:text_item, data_content: { ops: [] }) }

      it 'should set version to 1' do
        expect(item.version).to be nil
        item.save
        expect(item.version).to eq 1
      end
    end
  end

  context 'instance methods' do
    let(:data_content) do
      {
        ops: [
          { insert: "How might we do &lt;b&gt;X&lt;/b&gt;\n\n" },
          { insert: "\n", attributes: { header: 3 } },
          { insert: "What if we were to do that thing?\n" },
        ],
      }
    end
    let(:parent) { create(:collection) }
    let(:text_item) do
      create(:text_item, name: nil, content: '<p>How might we do <b>X</b></p>', data_content: data_content, parent_collection: parent)
    end

    describe '#plain_content' do
      it 'should create plaintext content based on data_content' do
        expect(text_item.plain_content).to eq 'How might we do X | What if we were to do that thing?'
      end
    end

    describe '#generate_name' do
      it 'should create an item name by stripping tags and truncating the content' do
        expect(text_item.name).to eq 'How might we do X'
      end
    end

    context 'realtime text editing' do
      let(:saved_version) { 1 }
      let(:edit_version) { 1 }
      let(:text_item) do
        create(:text_item, data_content: { ops: [], version: saved_version }, parent_collection: parent)
      end
      let(:user) { create(:user) }
      let(:data) do
        Mashie.new(
          delta: { ops: [{ insert: 'hi' }] },
          version: edit_version,
          full_content: { ops: [{ insert: 'hello hi' }] },
        )
      end

      describe '#threadlocked_transform_realtime_delta' do
        let(:result) do
          text_item.threadlocked_transform_realtime_delta(
            user,
            data,
          )
        end

        it 'should block if the process is locked' do
          expect(RedisMutex).to receive(:with_lock).and_raise(RedisMutex::LockError)
          expect(result).to include(
            error: 'locked',
            version: text_item.version,
            last_10: nil,
          )
        end

        it 'should return the results of text_item.transform_realtime_delta' do
          expect(text_item).to receive(:transform_realtime_delta).and_return(delta: data.delta)
          expect(result).to include(
            delta: data.delta,
          )
        end
      end

      describe '#transform_realtime_delta' do
        let(:result) do
          text_item.transform_realtime_delta(
            user: user,
            delta: data.delta,
            version: data.version,
            full_content: data.full_content,
          )
        end

        context 'when data.version == saved_version' do
          it 'should allow the edit and bump the version number' do
            # version goes from 1 to 2
            expect(result[:version]).to eq 2
            expect(text_item.data_content['ops']).to eq data.full_content.ops
          end

          it 'should include the last 10 deltas' do
          end
        end

        context 'when data.version < saved_version' do
          let(:saved_version) { 2 }
          let(:edit_version) { 1 }

          it 'should block the edit' do
            expect(result).to include(
              version: 2,
              error: 'locked',
            )
          end
        end
      end

      describe '#save_and_broadcast_quill_data' do
        let(:data) do
          Mashie.new(
            delta: { insert: 'hello' },
            version: 1,
            full_content: text_item.quill_data,
          )
        end
        it 'should not broadcast unless there are multiple viewers' do
          expect(CollectionUpdateBroadcaster).not_to receive(:new)
          text_item.save_and_broadcast_quill_data(user, data)
        end

        context 'with multiple viewers' do
          before do
            parent.started_viewing(user, dont_notify: true)
            parent.started_viewing(create(:user), dont_notify: true)
          end

          it 'should broadcast the updates' do
            expect(CollectionUpdateBroadcaster).to receive(:new).with(
              text_item.parent,
              user,
            )
            expect(TextItemBroadcastWorker).to receive(:perform_in).with(
              5.seconds,
              text_item.id,
              user.id,
            )
            expect(broadcaster_instance).to receive(:text_item_updated).with(text_item)
            text_item.save_and_broadcast_quill_data(user, data)
          end
        end
      end

      describe '#quill_data=' do
        let(:data_content) { { ops: [{ insert: 'hello!' }] } }
        let!(:text_item) { create(:text_item, version: 1, data_content: data_content) }

        context 'with no change' do
          it 'should not perform a realtime / version update' do
            # set it to the same thing again
            expect(text_item.version).to eq 1
            text_item.quill_data = data_content
            text_item.save
            expect(text_item.version).to eq 1
          end
        end

        context 'with a change' do
          it 'should perform a realtime / version update' do
            # set it to the same thing again
            expect(text_item.version).to eq 1
            expect(text_item.last_10).to be nil
            text_item.quill_data = { ops: [{ insert: 'goodbye.' }] }
            text_item.save
            expect(text_item.version).to eq 2
            expect(text_item.last_10.count).to eq 1
          end
        end
      end

      describe '#scrub_data_attrs' do
        let(:quill_data) do
          {
            ops: [
              { insert: 'part 1', attributes: { commentHighlight: '999', 'data-comment-id': '999' } },
              { insert: 'part 2', attributes: { undefined: '999' } },
            ],
          }
        end
        let!(:text_item) { create(:text_item, version: 1) }

        it 'should scrub any attributes that have data-comment-id with no commentHighlight' do
          text_item.quill_data = quill_data
          text_item.save
          expect(text_item.ops.first['attributes']['data-comment-id'].present?).to be true
          expect(text_item.ops.second['attributes'].length).to be 0
        end
      end
    end
  end
end
