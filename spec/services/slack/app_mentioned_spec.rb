require 'rails_helper'

RSpec.describe Slack::AppMentioned, type: :service do
  describe '#call' do
    let(:channel) { 'contactlessworld' }
    let(:event) do
      Mashie.new(
        channel: channel,
        type: event_type,
      )
    end
    subject do
      Slack::AppMentioned.new(
        event: event,
      )
    end

    context 'with event_type == "app_mention"' do
      let(:event_type) { 'app_mention' }

      it 'calls Slack::InShape::CreateChannelSearchCollection' do
        expect(Slack::InShape::CreateChannelSearchCollection).to receive(:call).with(
          channel: channel,
        )
        subject.call
      end
    end

    context 'with event_type != "app_mention"' do
      let(:event_type) { 'link_shared' }

      it 'does not call Slack::InShape::CreateChannelSearchCollection' do
        expect(Slack::InShape::CreateChannelSearchCollection).not_to receive(:call)
        subject.call
      end
    end
  end
end
