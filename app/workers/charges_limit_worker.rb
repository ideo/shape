class ChargesLimitWorker
  include Sidekiq::Worker

  LOW = 5000 / Organization::PRICE_PER_USER
  MIDDLE = 7500 / Organization::PRICE_PER_USER
  HIGH = 9500 / Organization::PRICE_PER_USER

  def perform
    Organization.billable.where(
      active_users_count: LOW...MIDDLE,
      sent_high_charges_low_email: false,
    ).find_each do |organization|
      ChargesLimitMailer.notify(organization).deliver_later
      organization.update_attributes!(sent_high_charges_low_email: true)
    end

    Organization.billable.where(
      active_users_count: MIDDLE...HIGH,
      sent_high_charges_middle_email: false,
    ).find_each do |organization|
      ChargesLimitMailer.notify(organization).deliver_later
      organization.update_attributes!(sent_high_charges_middle_email: true)
    end

    Organization.billable.where(
      sent_high_charges_high_email: false,
    ).where(
      Organization.arel_table[:active_users_count].gteq(HIGH),
    ).find_each do |organization|
      ChargesLimitMailer.notify(organization).deliver_later
      organization.update_attributes!(sent_high_charges_high_email: true)
    end
  end
end
