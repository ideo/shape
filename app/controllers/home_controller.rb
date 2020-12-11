# Serve up static pages
class HomeController < ApplicationController
  before_action :set_omniauth_state
  before_action :store_redirect_param, only: %i[login sign_up]
  before_action :capture_email_and_token, only: %i[login sign_up]

  def index
    # limited users aren't allowed to access the full Shape app
    if user_signed_in? && current_user.limited?
      sign_out :user
      redirect_to root_url
    end
    # for someone without admin access who tries to go to /sidekiq
    return redirect_to root_url if params[:path] == 'sidekiq'
  end

  def marketing
  end

  def login; end

  def sign_up
    # @user_was_signed_in = false
    # return unless user_signed_in?
    #
    # sign_out :user
    # @user_was_signed_in = true
    redirect_to sunset_url
  end

  def sign_out_and_redirect
    sign_out(current_user) if user_signed_in?
    url = NetworkApi::Authentication.provider_auth_url(
      provider: params[:provider],
      redirect_url: user_ideo_omniauth_callback_url(
        host: ENV['BASE_HOST'],
      ),
      cookies: cookies,
    )
    redirect_to url
  end

  def not_found
    render plain: 'not found', status: :not_found
  end

  before_action :require_dev_env, only: [:login_as]
  def login_as
    u = User.find(params[:id]) if params[:id]
    u ||= User.find_by(email: params[:email]) if params[:email]
    sign_in(:user, u) if u
    respond_to do |format|
      format.html { redirect_to root_url }
      format.json { render jsonapi: u }
    end
  end

  private

  def capture_email_and_token
    # might be nil which is ok
    @email = params[:email]
    @token = params[:token]
  end

  def store_redirect_param
    if params[:redirect].present?
      redirect_uri = clean_redirect
      store_location_for :user, redirect_uri
    end
    @redirect = stored_location_for(:user)
    return unless @redirect.present?

    # capturing devise stored_location_for also deletes it, in this case we want to put it back
    store_location_for :user, @redirect
  end

  def clean_redirect
    # clean non-ASCII URLs e.g. shape.space/ideo/items/123-c∆
    params.require(:redirect).chars.select(&:ascii_only?).join
  end

  def set_omniauth_state
    session['omniauth.state'] = cookies['IdeoSSO-State']
  end

  def require_dev_env
    redirect_to login_url if Rails.env.production?
  end
end
