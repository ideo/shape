class BillingChangesMailer < ApplicationMailer
  def notify(organization, new_active_users_count)
    payment_method = NetworkApi::PaymentMethod
                     .includes(:user)
                     .find(default: true, organization_id: organization.network_organization.id)
                     .first

    return unless payment_method.present?
    @new_users_count = new_active_users_count

    @subject = "#{new_active_users_count} new #{'user'.pluralize(@new_users_count)} joined Shape"

    @organization_name = organization.name
    @total_users_count = organization.active_users_count
    @additional_monthly_charge = Organization::PRICE_PER_USER * @new_users_count
    @next_monthly_charge = Organization::PRICE_PER_USER * @total_users_count
    @next_statement_date = Time.now.utc.end_of_month.to_s(:mdy)

    price_per_user_day = Organization::PRICE_PER_USER / Time.days_in_month(Time.current.month)
    days_remaining_in_month = (Time.current.end_of_month.day - Time.current.day) + 1
    Rails.logger.debug "#{price_per_user_day} #{days_remaining_in_month}"
    @prorated_charge_this_month = (@new_users_count * price_per_user_day * days_remaining_in_month).round(2)
    @url = root_url

    mail to: payment_method.user.email, subject: @subject, users: [payment_method.user]
  end
end
