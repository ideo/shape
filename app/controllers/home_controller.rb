# Serve up static pages
class HomeController < ApplicationController
  before_action :authenticate_user!, except: %i[login sign_up]
  before_action :set_okta_state

  def index
  end

  def login
  end

  def sign_up
    # might be nil which is ok
    @email = params[:email]
  end

  private

  def set_okta_state
    session['omniauth.state'] = cookies['IdeoSSO-State']
  end
end
