class MailingListSubscriptionWorker
  include Sidekiq::Worker

  def perform(user_id, list, subscribe)
    # only run in test/production environments
    return if Rails.env.development?

    user = User.find(user_id)

    MailingListSubscription.call(
      user: user,
      list: list,
      subscribe: subscribe,
    )
  rescue ActiveRecord::RecordNotFound
    # likely in dev / cypress task where the user was already destroyed
    logger.debug 'MailingListSubscriptionWorker: user not found.'
  end
end
