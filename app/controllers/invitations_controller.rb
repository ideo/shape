class InvitationsController < ApplicationController
  def accept
    token = params.require(:token)
    user = User.pending_user_with_token(token)
    if user.present?
      redirect_to sign_up_url(email: user.email, token: token, redirect: params[:redirect])
    else
      redirect_to login_url(redirect: params[:redirect])
    end
  end
end
