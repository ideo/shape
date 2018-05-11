class InvitationsController < ApplicationController
  def accept
    token = params.require(:token)
    if (user = User.pending_user_with_token(token))
      # store cookie
      session[:pending_user_token] = token
      # devise helper method
      store_location_for :user, params.require(:redirect)
      return redirect_to sign_up_url(email: user.email)
    end
    # if not found -- any error messaging to user?
    redirect_to login_url
  end
end
