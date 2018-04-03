class InvitationsController < ApplicationController
  def accept
    @user = User.pending_user_with_token(params.require(:token))

    # store cookie
    session[:pending_user_token] = @user.invitation_token if @user
    # if not found -- any error messaging to user?

    # this will redirect user to the invited path, where the user will be 401 Unauthorized
    # however it will store the attempted path to send them upon successful login
    redirect_to params.require(:redirect)
  end
end
