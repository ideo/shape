# == Schema Information
#
# Table name: test_audiences
#
#  id                 :bigint(8)        not null, primary key
#  closed_at          :datetime
#  price_per_response :decimal(10, 2)
#  sample_size        :integer
#  status             :integer          default("open")
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  audience_id        :bigint(8)
#  launched_by_id     :integer
#  network_payment_id :string
#  test_collection_id :bigint(8)
#
# Indexes
#
#  index_test_audiences_on_audience_id         (audience_id)
#  index_test_audiences_on_test_collection_id  (test_collection_id)
#
# Foreign Keys
#
#  fk_rails_...  (audience_id => audiences.id)
#

class TestAudience < ApplicationRecord
  belongs_to :audience
  belongs_to :test_collection,
             class_name: 'Collection::TestCollection',
             touch: true
  belongs_to :launched_by, class_name: 'User', optional: true
  has_many :survey_responses
  has_one :payment, as: :purchasable

  delegate :name,
           :link_sharing?,
           :audience_type,
           to: :audience

  validate :price_per_response_greater_than_minimum

  before_validation :set_price_per_response_from_audience, on: :create
  after_create :purchase, if: :requires_payment?

  delegate :name,
           to: :audience,
           prefix: true

  delegate :stripe_fee, to: :payment, allow_nil: true

  delegate :organization, to: :test_collection

  delegate :number_to_currency, to: 'ActionController::Base.helpers'

  # this will only get set in PurchaseTestAudience
  attr_writer :network_payment_method

  scope :challenge, -> { where(price_per_response: 0) }
  scope :link_sharing, -> { joins(:audience).where('price_per_response = 0 AND audiences.audience_type IS NULL') }
  scope :paid, -> { where('price_per_response > 0') }

  enum status: {
    open: 0,
    closed: 1,
  }

  def dataset_display_name
    "#{name} Audience"
  end

  def paid?
    price_per_response.positive?
  end

  def link_sharing?
    !paid?
  end

  def reached_sample_size?
    return false if link_sharing?

    survey_responses.completed.size >= sample_size
  end

  def description
    "#{launched_by.name} launched #{test_collection.name} test with " \
      "#{sample_size} total #{audience_name} audience respondents at " +
      number_to_currency(price_per_response || 0)
  end

  def total_price
    return 0 if price_per_response.blank? || price_per_response.zero?

    sample_size * price_per_response
  end

  def incentive_per_response
    audience.incentive_per_response(test_collection.paid_question_items.size)
  end

  def update_price_per_response_from_audience!
    set_price_per_response_from_audience
    save
  end

  def duplicate!(assign_test_collection: test_collection)
    ta = amoeba_dup
    ta.test_collection = assign_test_collection
    ta.save
    ta
  end

  private

  def set_price_per_response_from_audience
    self.price_per_response = audience&.price_per_response(test_collection.paid_question_items.size)
  end

  # This callback only gets called when using PurchaseTestAudience and setting payment_method
  def purchase
    create_payment(
      user: launched_by,
      organization: organization,
      network_payment_method_id: @network_payment_method.id,
      description: description,
      amount: total_price.to_f,
      quantity: sample_size,
      unit_amount: price_per_response.to_f,
    )

    return if payment.persisted?

    errors.add(:base, "Payment failed: #{payment.errors.full_messages.join('. ')}")
    # throw doesn't work in after_* callbacks, so use this to stop the transaction
    raise ActiveRecord::RecordInvalid, self
  end

  def requires_payment?
    @network_payment_method.present? && total_price.positive?
  end

  def price_per_response_greater_than_minimum
    if price_per_response.nil?
      errors.add(:price_per_response, 'must be present')
    elsif !price_per_response.zero? &&
          (price_per_response <= Audience.minimum_price_per_response)
      errors.add(
        :price_per_response,
        "must be greater than minimum of $#{Audience.minimum_price_per_response}",
      )
    end
  end
end
