class InvitationMailer < ApplicationMailer
  def invite(user_id:, invited_by_id:, invited_to_id: nil, invited_to_type:, application_user: nil)
    @user = User.find(user_id)
    @invited_by = User.find(invited_by_id)
    @invited_to_type = invited_to_type
    @invited_to = invited_to_type == Role::SHAPE_ADMIN.to_s.titleize ? invited_to_type : invited_to_type.safe_constantize.find(invited_to_id)
    @invited_to_name = get_invited_to_name(@invited_to)
    invited_to_url = frontend_url_for(@invited_to)
    @application_user = application_user

    if @invited_to.is_a?(Group) && !@invited_to.org_group?
      # only include the org name if it's not one of the main org groups
      @org_name = @invited_to.organization.name
    end

    if @user.pending?
      @url = accept_invitation_url(token: @user.invitation_token, redirect: invited_to_url)
    else
      @url = invited_to_url
    end
    from = 'Creative Difference <hello@ideocreativedifference.com>' if application_user.present?
    mail to: @user.email,
         subject: "Your invitation to \"#{@invited_to_name}\" on Shape",
         users: [@user],
         from: from
  end

  private

  def get_invited_to_name(invited_to)
    return invited_to.name if invited_to.respond_to?(:name)

    invited_to
  end
end
