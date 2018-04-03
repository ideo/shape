# for previewing emailer in browser
class InvitationMailerPreview < ActionMailer::Preview
  def invite
    u = User.pending.first
    InvitationMailer.invite(
      user_id: u.id,
      invited_by_id: User.second.id,
      invited_to_type: 'Collection',
      invited_to_id: u.collections.where(type: nil).first.id,
    )
  end
end
