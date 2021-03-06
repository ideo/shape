class PaymentMethodExpiringMailerPreview < ActionMailer::Preview
  def notify
    organization = Organization.last
    payment_method_id = NetworkApi::PaymentMethod.find(
      organization_id: organization.network_organization.id,
    ).first
    PaymentMethodExpiringMailer.notify(organization.id, payment_method_id)
  end
end
