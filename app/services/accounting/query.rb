module Accounting
  class Query
    def self.account_balances(account_identifier)
      # This table has fields: account, scope, balance and timestamps
      DoubleEntry::AccountBalance.where(
        account: account_identifier,
      )
    end

    # Load entry lines for a specific account
    # If you want metadata, you can also .includes(:metadata) on the scope this returns
    def self.lines_for_account(account, code: nil, order: :desc)
      lines = DoubleEntry::Line.where(account: account.identifier)
      lines = lines.where(scope: account.scope_identity) if account.scope_identity.present?
      lines = lines.where(code: code) if code.present?
      lines.order(created_at: order)
    end

    def self.sum(type)
      DoubleEntry::AccountBalance.where(account: type).sum(:balance).to_f / 100
    end
  end
end
