# NOTE: if audiences are free, will not really "purchase" but just create
class TestAudiencePurchaser
  include Interactor
  include Interactor::Schema
  delegate :number_to_currency, to: 'ActionController::Base.helpers'

  delegate :test_collection, :test_audience_params,
           :total_price, :user,
           to: :context

  schema :test_collection, :test_audience_params, :user, :total_price, :message

  delegate :organization, to: :test_collection

  before do
    context.total_price = 0
  end

  def call
    build_test_audiences
    charge_payment
    test_collection.save
  end

  private

  def build_test_audiences
    test_audience_params.each do |id, settings|
      next unless settings[:selected]
      audience = Audience.find(id)
      sample_size = settings[:sample_size].to_i
      # skip any TestAudience for audiences that cost money, where no sample_size was indicated
      next if audience.price_per_response.positive? && sample_size.zero?
      test_collection.test_audiences.build(
        sample_size: sample_size,
        price_per_response: audience.price_per_response,
        audience_id: audience.id,
      )
      context.total_price += sample_size * audience.price_per_response

    rescue ActiveRecord::RecordNotFound
      test_collection.errors.add(:test_audiences, 'not found')
      context.fail!
    end

    return if test_collection.test_audiences.present?

    test_collection.errors.add(:test_audiences, 'required')
    context.fail!
  end

  def charge_payment
    return true unless total_price.positive?
    # Purchase test
    payment_method = organization.network_default_payment_method

    if payment_method.blank?
      context.fail!(
        message: 'No valid payment method has been added',
      )
    end

    payment = NetworkApi::Payment.create(
      payment_method_id: payment_method.id,
      amount: total_price,
      description: payment_description,
    )
    return true if payment.status == 'succeeded'

    context.fail!(
      message: "Payment failed: #{payment.errors.full_messages.join('. ')}",
    )
  end

  def payment_description
    "#{user.name} launched #{test_collection.name} test with #{test_audience_description}."
  end

  def test_audience_description
    test_collection.test_audiences.map do |test_audience|
      "#{test_audience.sample_size} total " +
      "#{test_audience.audience_name} audience respondents at " +
      number_to_currency(test_audience.audience_price_per_response)
    end.join(' and ')
  end
end
