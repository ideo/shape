# == Schema Information
#
# Table name: payments
#
#  id                        :bigint(8)        not null, primary key
#  amount                    :decimal(10, 2)
#  description               :text
#  purchasable_type          :string
#  quantity                  :integer
#  unit_amount               :decimal(10, 2)
#  created_at                :datetime         not null
#  updated_at                :datetime         not null
#  network_payment_id        :integer
#  network_payment_method_id :integer
#  organization_id           :bigint(8)
#  purchasable_id            :bigint(8)
#  user_id                   :bigint(8)
#
# Indexes
#
#  index_payments_on_organization_id                      (organization_id)
#  index_payments_on_purchasable_type_and_purchasable_id  (purchasable_type,purchasable_id)
#  index_payments_on_user_id                              (user_id)
#

class Payment < ApplicationRecord
  belongs_to :user
  belongs_to :organization
  belongs_to :purchasable, polymorphic: true

  validates :amount, :network_payment_method_id, :description,
            presence: true

  before_create :create_network_payment, unless: :network_payment_id
  after_commit :record_payment, on: :create # Must be after commit so it is after transaction completes

  def network_payment_method
    return if network_payment_method_id.blank?
    @network_payment_method ||= NetworkApi::PaymentMethod.find(
      network_payment_method_id,
    )
  end

  def network_payment
    return if network_payment_id.blank?
    @network_payment ||= NetworkApi::Payment.find(network_payment_id)
  end

  def stripe_fee
    ((amount * BigDecimal('0.029')) + BigDecimal('0.3')).round(2)
  end

  def amount_without_stripe_fee
    amount - stripe_fee
  end

  private

  def create_network_payment
    network_payment = NetworkApi::Payment.create(
      payment_method_id: network_payment_method_id,
      description: description,
      amount: amount.to_f,
      quantity: quantity,
      unit_amount: unit_amount.to_f,
    )
    self.network_payment_id = network_payment.id
    return if network_payment.status == 'succeeded'

    errors.add(:base, network_payment.errors.full_messages.join('. '))
    throw :abort
  end

  def record_payment
    Accounting::RecordTransfer.payment_received(self)
  end
end
