# Serve up static pages
class HomeController < ApplicationController
  before_action :authenticate_user!, except: %i[login sign_up login_as]
  before_action :set_okta_state

  def index
  end

  def login
  end

  def sign_up
    # might be nil which is ok
    @email = params[:email]
  end

  def login_as
    redirect_to login_url unless Rails.env.development?
    u = User.find(params[:id])
    redirect_to login_url unless u
    sign_in(:user, u)
    redirect_to root_url
  end
  end

  private

  def set_okta_state
    session['omniauth.state'] = cookies['IdeoSSO-State']
  end
end
