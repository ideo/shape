class ApplicationController < ActionController::Base
  # protect_from_forgery with: :exception
  before_action :sign_in_user

  def sign_in_user
    sign_in User.find(1) unless user_signed_in?
  end
end
