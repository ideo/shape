require 'rails_helper'

RSpec.describe TextMessenger, type: :service do
  let(:phone_number) { '1234567890' }

  describe '#call' do
    let(:text_messenger) do
      TextMessenger.new(
        message: 'hello',
        phone_number: phone_number,
      )
    end

    it 'should initialize the twilio client' do
      expect(Twilio::REST::Client).to receive(:new)
      text_messenger.call
    end
  end
end
