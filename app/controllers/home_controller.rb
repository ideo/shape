# Serve up static pages
class HomeController < ApplicationController
  before_action :authenticate_user!, except: %i[login sign_up login_as]
  before_action :set_omniauth_state

  def index
  end

  def login
  end

  def sign_up
    # might be nil which is ok
    @email = params[:email]
  end

  before_action :require_dev_env, only: [:login_as]
  def login_as
    if (u = User.find(params[:id]))
      sign_in(:user, u)
    end
    redirect_to root_url
  end

  private

  def set_omniauth_state
    session['omniauth.state'] = cookies['IdeoSSO-State']
  end

  def require_dev_env
    redirect_to login_url unless Rails.env.development?
  end
end
