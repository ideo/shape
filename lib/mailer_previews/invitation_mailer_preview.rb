# for previewing emailer in browser
class InvitationMailerPreview < ActionMailer::Preview
  def invite
    u = User.where(status: User.statuses[:pending]).first
    # NOTE: will create a fake pending user in order to preview the email
    u ||= FactoryBot.create(:user, :pending)
    InvitationMailer.invite(u.id)
  end
end
