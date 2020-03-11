class InvitationMailer < ApplicationMailer
  def invite(
    user_id:,
    invited_by_id:,
    invited_to_id: nil,
    invited_to_type:,
    application: nil
  )
    @user = User.find(user_id)
    invited_by = User.find(invited_by_id)
    invited_to = invited_to_type == Role::SHAPE_ADMIN.to_s.titleize ? invited_to_type : invited_to_type.safe_constantize.find(invited_to_id)
    mail_helper_klass = application.present? ? MailerHelper::Application : MailerHelper::Shape

    @mail_helper = mail_helper_klass.new(
      application: application,
      invited_to: invited_to,
      invited_to_type: invited_to_type,
      invited_by: invited_by,
      user: @user,
    )

    mail to: @user.email,
         subject: @mail_helper.invite_subject,
         users: [@user],
         from: @mail_helper.invite_from_email
  end
end
