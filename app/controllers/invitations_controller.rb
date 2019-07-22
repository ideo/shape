class InvitationsController < ApplicationController
  def accept
    token = params.require(:token)
    if (user = User.pending_user_with_token(token))
      # devise helper method
      redirect_uri = params.require(:redirect)
      store_location_for :user, redirect_uri
      load_redirect_organization_from_url(redirect_uri)
      return redirect_to sign_up_url(email: user.email)
    end
    # if not found -- any error messaging to user?
    redirect_to login_url
  end
end
