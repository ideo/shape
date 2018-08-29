require 'csv'

class OrganizationUserReport
  def self.all_user_counts
    CSV.generate do |csv|
      csv << %w[name count]
      Organization.find_each do |org|
        next if org.all_active_users.count <= 1
        csv << [org.name, org.all_active_users.count]
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
