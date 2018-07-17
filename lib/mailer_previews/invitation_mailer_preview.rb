# for previewing emailer in browser
class InvitationMailerPreview < ActionMailer::Preview
  def invite
    u = User.first
    InvitationMailer.invite(
      user_id: u.id,
      invited_by_id: User.second.id,
      invited_to_type: 'Collection',
      invited_to_id: u.collections.where(type: nil).first.id,
    )
  end

  def invite_group
    u = User.first
    InvitationMailer.invite(
      user_id: u.id,
      invited_by_id: User.second.id,
      invited_to_type: 'Group',
      invited_to_id: Group.first.id,
    )
  end
end
