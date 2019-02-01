require 'csv'

class OrganizationUserReport
  def self.all_user_counts
    CSV.generate do |csv|
      csv << %w[
        name
        total_users
        active_last_3_months
        has_payment_method
        overdue_at
        trial_ends_at
        in_app_billing
        monthly_estimate
      ]
      Organization.where(deactivated: false).find_each do |org|
        users = org.users.active
        csv << [
          org.name,
          users.count,
          org.active_users_count,
          org.has_payment_method,
          org.overdue_at,
          org.trial_ends_at,
          org.in_app_billing,
          org.in_app_billing ? org.active_users_count * Organization::PRICE_PER_USER : 'N/A',
        ]
      end
    end
  end

  def self.active_users_in_domain(email: 'ideo.com', within: 3.months)
    User
      .active
      .where('last_active_at > ?', within.ago)
      .where('email LIKE ?', "%#{email}")
  end
end
