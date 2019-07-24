class InvitationsController < ApplicationController
  def accept
    token = params.require(:token)
    user = User.pending_user_with_token(token)
    if user.present?
      redirect_to sign_up_url(email: user.email, redirect: params[:redirect])
    else
      # if not found -- any error messaging to user?
      redirect_to login_url
    end
  end
end
