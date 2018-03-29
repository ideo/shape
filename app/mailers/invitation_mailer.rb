class InvitationMailer < ApplicationMailer
  def invite(user_id)
    @user = User.find(user_id)
    mail to: @user.email,
         subject: 'You have been invited to use Shape.'
  end
end
