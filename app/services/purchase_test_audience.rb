# NOTE: This is no longer creating link sharing audiences (they will be skipped since they already exist)
# could refactor this to more explicitly just focus on paid audiences
class PurchaseTestAudience
  include Interactor
  include Interactor::Schema

  delegate :test_collection, :test_audience_params,
           :user, :payment_method,
           to: :context

  schema :test_collection, :test_audience_params,
         :user, :payment_method, :message

  delegate :organization, to: :test_collection

  delegate :test_audiences, to: :test_collection

  before do
    # this could eventually use "in app purchase" payment method
    context.payment_method = organization.network_default_payment_method
  end

  def call
    create_test_audiences
    validate_test_audiences
    test_collection.save
  end

  private

  def validate_test_audiences
    if test_audiences.blank?
      test_collection.errors.add(:test_audiences, 'required')
      context.fail!(
        message: 'No audiences were selected',
      )
    end

    test_audiences.each do |test_audience|
      next if test_audience.errors.blank?

      error_message = "Could not purchase #{test_audience.audience_name} audience. " +
                      test_audience.errors.full_messages.join('. ') + '.'

      context.fail!(message: error_message)
    end
  end

  def ensure_valid_payment_method
    return if payment_method.present?

    context.fail!(
      message: 'No valid payment method has been added',
    )
  end

  def create_test_audiences
    test_audience_params.each do |id, settings|
      next unless settings[:selected]

      audience = Audience.find(id)
      sample_size = settings[:sample_size].to_i
      # skip any TestAudience for audiences that cost money,
      # where no sample_size was indicated
      next if audience.min_price_per_response.positive? && sample_size.zero?
      # skip any TestAudience that this test already has
      next if test_collection.test_audiences.find_by_audience_id(id).present?

      ensure_valid_payment_method if audience.min_price_per_response.positive?

      test_collection.test_audiences.create(
        sample_size: sample_size,
        audience: audience,
        launched_by: user,
        network_payment_method: payment_method,
      )

    rescue ActiveRecord::RecordNotFound
      test_collection.errors.add(:test_audiences, 'not found')
      context.fail!
    end
  end
end
