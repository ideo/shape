class MailchimpSubscriptionWorker
  include Sidekiq::Worker

  def perform(user_id)
    user = User.find(user_id)
    MailchimpSubscription.call(user: user)
  end
end
