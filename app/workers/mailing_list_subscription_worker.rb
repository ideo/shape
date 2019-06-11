class MailingListSubscriptionWorker
  include Sidekiq::Worker

  def perform(user_id, list, subscribe)
    user = User.find(user_id)

    MailingListSubscription.call(
      user: user,
      list: list,
      subscribe: subscribe,
    )
  end
end
