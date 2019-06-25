module PaidTests
  class ExportPendingIncentives < SimpleService
    def call
      CSV.generate do |csv|
        csv << csv_header
        pending_incentive_users.each do |user|
          csv << [
            user.uid,
            user.name,
            user.email,
            user.phone,
            format('%.2f', amount_owed_by_user_id[user.id]),
          ]
        end
      end
    end

    def self.mark_as_paid!
      SurveyResponse
        .incentive_owed
        .each(&:record_incentive_paid!)
    end

    private

    def csv_header
      ['User ID', 'Name', 'Email', 'Phone', 'Amount Owed']
    end

    def pending_incentive_users
      SurveyResponse
        .incentive_owed
        .group(:user_id, :id)
        .includes(:user)
        .map(&:user)
    end

    def amount_owed_by_user_id
      @amount_owed_by_user_id ||= Accounting::Query
        .account_balances(:individual_owed)
        .where(scope: pending_incentive_users.map(&:id))
        .each_with_object({}) do |account_balance, h|
          h[account_balance.scope.to_i] = account_balance.balance.to_f
        end
    end
  end
end
