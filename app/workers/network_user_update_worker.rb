class NetworkUserUpdateWorker
  include Sidekiq::Worker

  def perform(user_id, field)
    user = User.find_by(id: user_id)
    return unless user&.network_user.present?

    user.network_user.update(field => user.send(field))
  end
end
