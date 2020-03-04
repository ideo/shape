# for previewing emailer in browser
class InvitationMailerPreview < ActionMailer::Preview
  def invite
    invitation = NetworkInvitation.joins(:user).where(User.arel_table[:status].eq(User.statuses[:pending])).first
    invited = invitation.user
    InvitationMailer.invite(
      user_id: invited.id,
      invited_by_id: User.first.id,
      invited_to_type: 'Collection',
      invited_to_id: Collection.not_custom_type.first.id,
    )
  end

  def invite_group
    u = User.first
    InvitationMailer.invite(
      user_id: u.id,
      invited_by_id: User.second.id,
      invited_to_type: 'Group',
      invited_to_id: Group.last.id,
      application: Application.first,
    )
  end
end
