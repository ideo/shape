class BillingChangesMailer < ApplicationMailer
  def notify(organization, new_active_users_count)
    payment_method = NetworkApi::PaymentMethod
                     .includes(:user)
                     .find(default: true, organization_id: organization.network_organization.id)
                     .first

    @new_users_count = new_active_users_count

    @subject = "#{new_active_users_count} new #{'user'.pluralize(@new_users_count)} joined Shape"

    @organization_name = organization.name
    @total_users_count = organization.active_users_count
    @additional_monthly_charge = Organization::PRICE_PER_USER * @new_users_count
    @next_monthly_charge = Organization::PRICE_PER_USER * @total_users_count
    @next_statement_date = Time.now.utc.end_of_month.to_s(:mdy)
    @prorated_charge_this_month = @new_users_count * (Organization::PRICE_PER_USER / (
      (Time.current.end_of_month.day - Time.current.day) + 1
    )).round(2)
    @url = root_url

    mail to: payment_method.user.email, subject: @subject
  end
end
