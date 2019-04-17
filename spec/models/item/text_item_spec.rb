require 'rails_helper'

RSpec.describe Item::TextItem, type: :model do
  context 'instance methods' do
    let(:data_content) do
      {
        ops: [
          { insert: "How might we do &lt;b&gt;X&lt;/b&gt;\n\n" },
          { insert: "\n", attributes: { header: 3 } },
          { insert: "\What if we were to do that thing?\n" },
        ],
      }
    end
    let(:text_item) { create(:text_item, name: nil, content: '<p>How might we do <b>X</b></p>', data_content: data_content) }

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
      let(:text_item) { create(:text_item, data_content: { ops: [], version: saved_version }) }
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
            user,
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
    end
  end
end
