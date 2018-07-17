class InvitationMailer < ApplicationMailer
  def invite(user_id:, invited_by_id:, invited_to_id:, invited_to_type:)
    @user = User.find(user_id)
    @invited_by = User.find(invited_by_id)
    @invited_to_type = invited_to_type
    @invited_to = invited_to_type.safe_constantize.find(invited_to_id)
    invited_to_url = frontend_url_for(@invited_to)

    if @invited_to.is_a?(Group) && !@invited_to.org_group?
      # only include the org name if it's not one of the main org groups
      @org_name = @invited_to.organization.name
    end

    if @user.pending?
      @url = accept_invitation_url(token: @user.invitation_token, redirect: invited_to_url)
    else
      @url = invited_to_url
    end
    mail to: @user.email,
         subject: "Your invitation to \"#{@invited_to.name}\" on Shape"
  end
end
