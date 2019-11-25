require 'csv'

class ShapeUserReport
  def self.all_users_headers
    %w[
      email
      first_name
      last_name
      created_at
      org_has_payment
    ]
  end

  def self.all_users
    CSV.generate do |csv|
      csv << all_users_headers
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

  def self.incentives_paid_headers
    %w[
      response_id
      user_id
      email
      first_name
      last_name
      incentive_paid_at
      incentive_paid
      test_collection
      audience
    ]
  end

  def self.incentives_paid(timeframe = 30.days.ago)
    CSV.generate do |csv|
      csv << incentives_paid_headers
      SurveyResponse
        .includes(:user, :test_collection, test_audience: :audience)
        .incentive_paid
        .where('incentive_paid_at > ?', timeframe)
        .order('user_id')
        .find_in_batches
        .each do |batch|
          batch.each do |sr|
            user = sr.user
            csv << [
              sr.id,
              user.id,
              user.email,
              user.first_name,
              user.last_name,
              sr.incentive_paid_at,
              sr.incentive_paid_amount.to_f,
              sr.test_collection.name,
              sr.test_audience.audience.name,
            ]
          end
        end
    end
  end
end
