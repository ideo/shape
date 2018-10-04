class MailchimpSubscriptionWorker
  include Sidekiq::Worker

  def perform(user_id, subscribe)
    user = User.find(user_id)
    MailchimpSubscription.call(user: user, subscribe: subscribe)
  end
end
