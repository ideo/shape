require 'double_entry'

DoubleEntry.configure do |config|
  config.define_accounts do |accounts|
    payment_scope = ->(network_payment) do
      raise 'not a NetworkApi::Payment' unless network_payment.class.name == 'NetworkApi::Payment'
      network_payment.id
    end
    user_scope = ->(user) do
      raise 'not a User' unless user.class.name == 'User'
      user.id
    end
    # test_audience_scope = ->(test_audience) do
    #   raise 'not a TestAudience' unless test_audience.class.name == 'TestAudience'
    #   test_audience.id
    # end
    accounts.define(identifier: :cash, scope_identifier: payment_scope)
    accounts.define(identifier: :receivable, scope_identifier: payment_scope)
    accounts.define(identifier: :individual, scope_identifier: user_scope, positive_only: true)
    accounts.define(identifier: :revenue, scope_identifier: payment_scope, positive_only: true)
    accounts.define(identifier: :payment_processor, scope_identifier: payment_scope, positive_only: true)
  end

  config.define_transfers do |transfers|
    transfers.define(from: :cash, to: :receivable, code: :purchase)
    transfers.define(from: :receivable, to: :individual, code: :payout)
    transfers.define(from: :receivable, to: :revenue, code: :commission)
    transfers.define(from: :receivable, to: :payment_processor, code: :transaction_fee)
  end
end
