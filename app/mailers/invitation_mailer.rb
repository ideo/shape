class InvitationMailer < ApplicationMailer
  def invite(user_id:, invited_by_id:, invited_to_id: nil, invited_to_type:, application: nil)
    @user = User.find(user_id)
    @invited_by = User.find(invited_by_id)
    @invited_to_type = invited_to_type
    @invited_to = invited_to_type == Role::SHAPE_ADMIN.to_s.titleize ? invited_to_type : invited_to_type.safe_constantize.find(invited_to_id)
    @invited_to_name = get_invited_to_name(@invited_to)
    invited_to_url = frontend_url_for(@invited_to)
    @application = ApplicationInfo(application)

    if @invited_to.is_a?(Group) && !@invited_to.org_group?
      if application.present?
        @group_name = @invited_to.name
                                 .sub('C∆ - ', '')
                                 .sub('Admins', '')
                                 .sub('Members', '')
      end
      # only include the org name if it's not one of the main org groups
      @org_name = @invited_to.organization.name
    end

    if @user.pending?
      @url = accept_invitation_url(token: @user.invitation_token, redirect: invited_to_url)
    else
      @url = @application.invite_url(@invited_to)
    end

    from = application.email
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
