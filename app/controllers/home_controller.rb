# Serve up static pages
class HomeController < ApplicationController
  before_action :authenticate_user!, except: [:login]
  before_action :set_okta_state

  def index
  end

  def login
  end

  private

  def set_okta_state
    session['omniauth.state'] = cookies['IdeoSSO-State']
    u = User.find(9)
    sign_in(:user, u)
  end

end
