class InvitationsController < ApplicationController
  def accept
    @user = User.where(
      invitation_token: params.require(:token),
      status: User.statuses[:pending],
    ).first

    # store cookie
    session[:pending_user_id] = @user.id if @user
    # if not found -- any error messaging to user?

    # after login we will access the pending_user_id cookie
    redirect_to login_url
  end
end
