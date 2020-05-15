require 'rails_helper'

RSpec.describe Slack::ProcessEventReceived, type: :service do
  describe '#call' do
    let(:client_double) { double('client') }

    subject do
      Slack::ProcessEventReceived.call(
        event: Mashie.new(type: 'slack_event'),
      )
    end

    before do
      allow(Slack::Web::Client).to receive(:new).and_return(client_double)
    end

    it 'calls all of the underlying interactors' do
      expect(Slack::AppMentioned).to receive(:new).and_call_original
      expect(Slack::ProcessMessageForLinks).to receive(:new).and_call_original
      expect(Slack::Unfurl).to receive(:new).and_call_original
      subject
    end
  end
end
