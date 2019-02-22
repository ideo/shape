require 'rails_helper'

RSpec.describe ItemEditingChannel, type: :channel do
  let(:item) { create(:text_item) }
  let(:user) { create(:user) }
  let(:stream_name) { item.stream_name }

  before do
    stub_connection current_user: user
  end

  describe '#subscribe' do
    it 'notifies of viewer' do
      expect { subscribe(id: item.id) }.to have_broadcasted_to(stream_name).with(
        current_editor: {},
        num_viewers: 1,
        item_data_content: item.data_content,
        record_id: item.id.to_s,
        record_type: 'items',
      )
    end
  end

  describe '#start_editing' do
    let!(:subscription) { subscribe(id: item.id) }

    it 'notifies of editor' do
      expect { perform(:start_editing) }.to have_broadcasted_to(stream_name).with(
        current_editor: user.as_json,
        num_viewers: 1,
        item_data_content: item.data_content,
        record_id: item.id.to_s,
        record_type: 'items',
      )
    end

    context 'with an existing viewer' do
      let(:user_2) { create(:user) }

      before do
        item.started_viewing(user_2)
      end

      it 'notifies of viewer and editor' do
        expect { perform(:start_editing) }.to have_broadcasted_to(stream_name).with(
          current_editor: user.as_json,
          num_viewers: 2,
          item_data_content: item.data_content,
          record_id: item.id.to_s,
          record_type: 'items',
        )
      end
    end
  end

  describe '#stop_editing' do
    let!(:subscription) { subscribe(id: item.id) }

    it 'notifies editing stopped' do
      expect { perform(:stop_editing) }.to have_broadcasted_to(stream_name).with(
        current_editor: {},
        num_viewers: 1,
        item_data_content: item.data_content,
        record_id: item.id.to_s,
        record_type: 'items',
      )
    end
  end

  describe '#unsubscribed' do
    let!(:subscription) { subscribe(id: item.id) }

    it 'notifies viewer left' do
      expect { subscription.unsubscribed }.to have_broadcasted_to(stream_name).with(
        current_editor: {},
        num_viewers: 0,
        item_data_content: item.data_content,
        record_id: item.id.to_s,
        record_type: 'items',
      )
    end
  end
end
