class OrganizationAutojoiner
  def initialize(user)
    @user = user
  end

  def available_orgs
    domain = @user.email.split('@').last
    Organization.where("autojoin_domains ? '#{domain}'")
  end

  def autojoin
    available_orgs.find_each.map do |org|
      # bypass if they're already a member
      next if org.can_view? @user
      org.setup_user_membership_and_collections(@user)
      org
    end.compact
  end
end
