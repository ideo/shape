class OrganizationAutojoiner
  def initialize(user)
    @user = user
    @group = nil
  end

  def available_orgs
    domain = @user.email.split('@').last
    orgs = Organization.where("autojoin_domains ? '#{domain.downcase}'").to_a
    # NOTE: this group.autojoin_emails function is mainly just used for a Mitsui import.
    # Can remove once SCIM + provisioning is implemented.
    @group = Group.where("autojoin_emails ? '#{@user.email.downcase}'").first
    # turn it into an AR relation rather than an array
    orgs << @group.organization if @group
    orgs
  end

  def autojoin
    available_orgs.map do |org|
      # bypass if they're already a member
      next if org.can_view? @user
      org.setup_user_membership_and_collections(@user)
      if @group
        Roles::MassAssign.call(
          object: @group,
          role_name: Role::MEMBER,
          users: [@user],
          new_role: true,
        )
      end
      org
    end.compact
  end
end
