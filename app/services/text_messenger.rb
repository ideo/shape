class TextMessenger < SimpleService
  attr_reader :errors

  def initialize(message:, phone_number:)
    @message = message
    @phone_number = phone_number
    @errors = []
  end

  def call
    return false unless init_twilio

    send_message
  end

  private

  def init_twilio
    @client = Twilio::REST::Client.new
  end

  def send_message
    @client.messages.create(
      from: ENV['TWILIO_PHONE_NUMBER'],
      to: @phone_number,
      body: @message,
    )
  end
end
