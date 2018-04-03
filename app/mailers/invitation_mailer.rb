class InvitationMailer < ApplicationMailer
  def invite(user_id:, invited_by_id:, invited_to_id: nil, invited_to_type: nil)
    @user = User.find(user_id)
    @invited_by = User.find(invited_by_id)
    if invited_to_type && invited_to_id
      @invited_to_type = invited_to_type
      @invited_to = invited_to_type.safe_constantize.find(invited_to_id)
      invited_to_url = frontend_url_for(@invited_to)
    else
      invited_to_url = root_url
    end
    if @user.pending?
      @url = accept_invitation_url(token: @user.invitation_token, redirect: invited_to_url)
    else
      @url = invited_to_url
    end
    mail to: @user.email,
         subject: 'Your invitation to Shape.'
  end
end
