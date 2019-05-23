class TestAudience < ApplicationRecord
  belongs_to :audience
  belongs_to :test_collection,
             class_name: 'Collection::TestCollection'
  belongs_to :launched_by, class_name: 'User'
  has_many :survey_responses

  validates :price_per_response, presence: true

  before_validation :set_price_per_response_from_audience, on: :create
  before_create :purchase, if: :requires_payment?

  delegate :name, :price_per_response,
           to: :audience,
           prefix: true

  delegate :organization, to: :test_collection

  delegate :number_to_currency, to: 'ActionController::Base.helpers'

  # this will only get set in PurchaseTestAudience
  attr_writer :payment_method

  def description
    "#{launched_by.name} launched #{test_collection.name} test with " \
      "#{sample_size} total #{audience_name} audience respondents at " +
      number_to_currency(price_per_response || 0)
  end

  def total_price
    return 0 if price_per_response.blank?
    sample_size * price_per_response
  end

  def network_payment
    return if network_payment_id.blank?
    @network_payment ||= NetworkApi::Payment.find(network_payment_id)
  end

  private

  # This callback only gets called when using PurchaseTestAudience and setting payment_method
  def purchase
    return unless valid?

    payment = NetworkApi::Payment.create(
      payment_method_id: @payment_method.id,
      description: description,
      amount: total_price.to_f,
      quantity: sample_size,
      unit_amount: price_per_response.to_f,
    )
    self.network_payment_id = payment.id
    return payment if payment.status == 'succeeded'

    errors.add(:base, "Payment failed: #{payment.errors.full_messages.join('. ')}")
    throw :abort
  end

  def requires_payment?
    @payment_method.present? && total_price.positive?
  end

  def set_price_per_response_from_audience
    self.price_per_response ||= audience&.price_per_response
  end
end
