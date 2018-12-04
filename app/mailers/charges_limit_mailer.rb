class ChargesLimitMailer < ApplicationMailer
  def notify(organization)
    @organization_name = organization.name
    @active_users_count = organization.active_users_count
    @next_monthly_charge = Organization::PRICE_PER_USER * @active_users_count

    @subject = "High monthly bill for #{@organization_name}"
    mail to: Shape::SUPPORT_EMAIL, subject: @subject
  end
end
