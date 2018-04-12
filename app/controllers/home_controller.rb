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
  end

end
