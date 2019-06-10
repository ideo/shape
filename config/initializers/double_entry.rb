require 'double_entry'

DoubleEntry.configure do |config|
  config.define_accounts do |accounts|
    user_scope = ->(user) do
      raise 'not a User' unless user.class.name == 'User'
      user.id
    end
    accounts.define(identifier: :cash)
    accounts.define(identifier: :receivable)
    accounts.define(identifier: :payment_processor, positive_only: true)
    accounts.define(identifier: :individual_owed, scope_identifier: user_scope, positive_only: true)
    accounts.define(identifier: :individual_paid, scope_identifier: user_scope, positive_only: true)
    accounts.define(identifier: :revenue, positive_only: true)
  end

  config.define_transfers do |transfers|
    transfers.define(from: :cash, to: :receivable, code: :purchase)
    transfers.define(from: :cash, to: :payment_processor, code: :stripe_fee)
    transfers.define(from: :receivable, to: :payment_processor, code: :paypal_fee)
    transfers.define(from: :receivable, to: :individual_owed, code: :payout_owed)
    transfers.define(from: :receivable, to: :revenue, code: :commission)
    transfers.define(from: :individual_owed, to: :individual_paid, code: :payout)
  end
end
