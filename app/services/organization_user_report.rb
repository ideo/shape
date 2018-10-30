require 'csv'

class OrganizationUserReport
  def self.all_user_counts
    CSV.generate do |csv|
      csv << %w[name total active_last_3_months]
      Organization.find_each do |org|
        next if org.users.active.count <= 1
        active_users = org.users.active
        recent = active_users.where('last_sign_in_at > ?', 3.months.ago)
        csv << [org.name, active_users.count, recent.count]
      end
    end
  end

  def self.active_users(email: 'ideo.com', within: 3.months)
    User
      .active
      .where('last_sign_in_at > ?', within.ago)
      .where('email LIKE ?', "%#{email}")
  end
end
