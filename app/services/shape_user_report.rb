require 'csv'

class ShapeUserReport
  def self.all_users
    CSV.generate do |csv|
      csv << %w[
        email
        first_name
        last_name
        created_at
        org_has_payment
      ]
      User.active.includes(:current_organization).find_in_batches.each do |batch|
        batch.each do |user|
          csv << [
            user.email,
            user.first_name,
            user.last_name,
            user.created_at,
            user.current_organization&.has_payment_method ? true : false,
          ]
        end
      end
    end
  end
end
