require 'rails_helper'

RSpec.describe ItemRealtimeChannel, type: :channel do
  let(:editor) { create(:user) }
  let(:item) { create(:text_item, add_editors: [editor]) }
  let(:other_user) { create(:user) }
  let(:stream_name) { item.stream_name }

  before do
    stub_connection current_user: user
  end

  describe '#subscribed' do
    context 'without edit access' do
      let(:user) { other_user }
      let!(:subscription) { subscribe(id: item.id) }

      it 'rejects the subscription' do
        expect(subscription).to be_rejected
      end
    end

    context 'with edit access' do
      let(:user) { editor }
      it 'notifies of viewer' do
        expect { subscribe(id: item.id) }.to have_broadcasted_to(stream_name).with(
          current_editor: {},
          num_viewers: 1,
          record_id: item.id.to_s,
          record_type: 'items',
        )
      end
    end
  end

  describe '#unsubscribed' do
    let(:user) { editor }
    let!(:subscription) { subscribe(id: item.id) }

    it 'notifies viewer left' do
      expect { subscription.unsubscribed }.to have_broadcasted_to(stream_name).with(
        current_editor: {},
        num_viewers: 0,
        record_id: item.id.to_s,
        record_type: 'items',
      )
    end
  end

  describe '#delta' do
    let(:user) { editor }
    let!(:subscription) { subscribe(id: item.id) }
    let(:data) do
      {
        delta: { ops: [] },
        version: 1,
        full_content: { ops: [] },
      }
    end

    it 'notifies of item delta' do
      expect { perform(:delta, data) }.to have_broadcasted_to(stream_name).with(
        hash_including(
          current_editor: user.as_json,
          num_viewers: 1,
          record_id: item.id.to_s,
          record_type: 'items',
          data: hash_including(
            delta: data[:delta],
            version: data[:version],
            last_10: anything,
          ),
        ),
      )
    end
  end

  describe '#cursor' do
    let(:user) { editor }
    let!(:subscription) { subscribe(id: item.id) }
    let(:data) do
      { range: 'x' }
    end

    it 'notifies of cursor position' do
      expect { perform(:cursor, data) }.to have_broadcasted_to(stream_name).with(
        hash_including(
          current_editor: user.as_json,
          num_viewers: 1,
          record_id: item.id.to_s,
          record_type: 'items',
          data: {
            range: data[:range],
            action: 'cursor',
          },
        ),
      )
    end
  end
end
