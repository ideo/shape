class Callbacks::IdeoNetworkController < ApplicationController
  before_action :authenticate_request

  def users
    if user.present?
      if event == :updated
        process_user_updated
      elsif event == :deleted
        process_user_deleted
      else
        logger.debug("Unsupported users event: #{event}")
        head :bad_request
        return
      end
    end

    head :ok
  end

  private

  def process_user_updated
    user.update_from_network_profile(user_params)
  end

  def process_user_deleted
    user.destroy
  end

  def event
    params[:event].to_sym
  end

  def user
    @user ||= User.find_by_uid(params[:uid])
  end

  def user_params
    params.require(:user).permit(
      :uid,
      :provider,
      :first_name,
      :last_name,
      :email,
      :picture,
    )
  end

  def authenticate_request
    return true if request.headers['HTTP_AUTHORIZATION'] == ENV['IDEO_NETWORK_CALLBACK_SECRET']

    head :unauthorized
  end
end
