class PaymentMethodExpiringMailer < ApplicationMailer
  def notify(organization_id, payment_method_id)
    organization = Organization.find(organization_id)
    @payment_method = NetworkApi::PaymentMethod
                      .includes(:user)
                      .find(payment_method_id)
                      .first
    @organization_name = organization.name
    @next_monthly_charge = Organization::PRICE_PER_USER * organization.active_users_count
    @next_statement_date = Time.now.utc.end_of_month.to_s(:mdy)
    @url = "#{root_url}billing"

    @subject = 'Shape default payment method is expiring soon'
    mail to: @payment_method.user.email, subject: @subject, users: [@payment_method.user]
  end
end
