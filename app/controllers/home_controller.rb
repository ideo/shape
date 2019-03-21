# Serve up static pages
class HomeController < ApplicationController
  before_action :authenticate_user!, only: %i[index]
  before_action :set_omniauth_state

  def index
    # for someone without admin access who tries to go to /sidekiq
    return redirect_to root_url if params[:path] == 'sidekiq'
  end

  def marketing
  end

  def login
  end

  def sign_up
    @user_was_signed_in = false
    if user_signed_in?
      sign_out :user
      @user_was_signed_in = true
    end
    # might be nil which is ok
    @email = params[:email]
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

  def set_omniauth_state
    session['omniauth.state'] = cookies['IdeoSSO-State']
  end

  def require_dev_env
    redirect_to login_url if Rails.env.production?
  end
end
