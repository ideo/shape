class CollectionChallengeSetup < SimpleService
  def initialize(collection:, current_user:)
    @collection = collection
    @current_user = current_user
  end

  def call
    return unless @collection.collection_type == 'challenge' ||
                  (@collection.challenge_admin_group.blank? && @collection.challenge_reviewer_group.blank? &&
                  @collection.challenge_participant_group.blank?)

    # collections that become a challenge gets their roles unanchored
    if @collection.roles_anchor_collection_id.present?
      @collection.unanchor_and_inherit_roles_from_anchor!
    end

    collection_name = @collection.name
    organization = @collection.organization

    admin_group = @collection.create_challenge_admin_group(
      name: "#{collection_name} Admins",
      organization: organization,
    )
    reviewer_group = @collection.create_challenge_reviewer_group(
      name: "#{collection_name} Reviewers",
      organization: organization,
    )
    participant_group = @collection.create_challenge_participant_group(
      name: "#{collection_name} Participants",
      organization: organization,
    )

    @current_user.add_role(Role::ADMIN, admin_group)
    @current_user.add_role(Role::ADMIN, participant_group)
    @current_user.add_role(Role::ADMIN, reviewer_group)

    admin_group.add_role(Role::ADMIN, reviewer_group)
    admin_group.add_role(Role::ADMIN, participant_group)

    admin_group.add_role(Role::EDITOR, @collection)
    participant_group.add_role(Role::VIEWER, @collection)
    reviewer_group.add_role(Role::VIEWER, @collection)

    @collection.update(challenge_admin_group_id: admin_group.id,
                       challenge_reviewer_group_id: reviewer_group.id,
                       challenge_participant_group_id: participant_group.id)
  end
end
