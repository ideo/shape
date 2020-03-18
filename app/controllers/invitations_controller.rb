class InvitationsController < ApplicationController
  def accept
    token = params.require(:token)
    invitation = NetworkInvitation.find_by_token(token)
    user = invitation&.user
    if user.present? && user.pending?
      redirect_to sign_up_url(email: user.email, token: token, redirect: params[:redirect])
    else
      redirect_to login_url(email: user&.email, redirect: params[:redirect])
    end
  end
end
