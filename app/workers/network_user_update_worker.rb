class NetworkUserUpdateWorker
  include Sidekiq::Worker

  def perform(user_id, params)
    user = User.find_by(id: user_id)
    return unless user&.network_user.present?
    user.network_user.update(params)
  end
end
