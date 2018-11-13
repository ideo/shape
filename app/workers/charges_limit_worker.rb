class ChargesLimitWorker
  include Sidekiq::Worker

  LOW = 5000 / Organization::PRICE_PER_USER
  MIDDLE = 7500 / Organization::PRICE_PER_USER
  HIGH = 9500 / Organization::PRICE_PER_USER

  def perform
    Organization.where(
      in_app_billing: true,
      active_users_count: LOW...MIDDLE,
      sent_high_charges_low_email: false,
    ).find_each do |organization|
      ChargesLimitMailer.notify(organization).deliver_now
      organization.update_attributes!(sent_high_charges_low_email: true)
    end

    Organization.where(
      in_app_billing: true,
      active_users_count: MIDDLE...HIGH,
      sent_high_charges_middle_email: false,
    ).find_each do |organization|
      ChargesLimitMailer.notify(organization).deliver_now
      organization.update_attributes!(sent_high_charges_middle_email: true)
    end

    Organization.where(
      in_app_billing: true,
      sent_high_charges_high_email: false,
    ).where(
      Organization.arel_table[:active_users_count].gteq(HIGH),
    ).find_each do |organization|
      ChargesLimitMailer.notify(organization).deliver_now
      organization.update_attributes!(sent_high_charges_high_email: true)
    end
  end
end
