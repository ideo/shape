class MailingListSubscriptionWorker
  include Sidekiq::Worker

  def perform(user_id, subscribe)
    user = User.find(user_id)
    MailingListSubscription.call(user: user, subscribe: subscribe)
  end
end
