class InvitationMailer < ApplicationMailer
  def invite(user_id:, invited_by_id:, invited_to_id: nil, invited_to_type:, application: nil)
    @user = User.find(user_id)
    invited_by = User.find(invited_by_id)
    invited_to = invited_to_type == Role::SHAPE_ADMIN.to_s.titleize ? invited_to_type : invited_to_type.safe_constantize.find(invited_to_id)
    invited_to_url = frontend_url_for(invited_to)
    invite_info_klass = application.present? ? MailerHelper::Application : MailerHelper::Shape

    @application = invite_info_klass.new(
      application: application,
      invited_to: invited_to,
      invited_to_type: invited_to_type,
      invited_by: invited_by,
    )

    if @user.pending?
      @url = accept_invitation_url(token: @user.invitation_token, redirect: invited_to_url)
    else
      @url = @application.invite_url(invited_to)
    end

    mail to: @user.email,
         subject: @application.invite_subject,
         users: [@user],
         from: @application.invite_from_email
  end

  private

  def get_invited_to_name(invited_to)
    return invited_to.name if invited_to.respond_to?(:name)

    invited_to
  end
end
