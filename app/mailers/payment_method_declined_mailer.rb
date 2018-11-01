class PaymentMethodDeclinedMailer < ApplicationMailer
  def notify(organization, type, replaced)
    payment_method = NetworkApi::PaymentMethod
                     .includes(:user)
                     .find(default: true, organization_id: organization.network_organization.id)
                     .first

    payment_method_has = "The defualt payment method on file for your account has #{type == :expired ? 'expired' : 'been declined'}."

    if replaced
      @subject = 'Your default payment method has been replaced'
      @mesage =  "#{payment_method_has} It has been replaced by another existing payment method found on your account. Please go to the Shape billing page to make any adjustments."
    else
      if type == :expired
        @subject = payment_method_has
        @message = "#{payment_method_has} Please go to the Shape billing page to add a new payment method to your account."
      else
        @subject = payment_method_has
        @message = "#{payment_method_has} Please go to the Shape billing page to add a new payment method to your account."
      end
    end

    @type = type
    @replaced = replaced

    @billing_button_text = @type == :replaced ? 'Go To Billing' : 'Add Payment Method'

    @organization_name = organization.name
    @next_monthly_charge = Organization::PRICE_PER_USER * organization.active_users_count
    @next_statement_date = Time.now.utc.end_of_month.to_s(:mdy)
    @url = root_url

    mail to: payment_method.user.email, subject: @subject
  end
end
