class NetworkOrganizationUserSyncWorker
  include Sidekiq::Worker

  def perform(user_uid, org_id, role_name, action)
    action = action.to_sym
    get_network_organization(org_id)
    if @network_organization.blank?
      logger.error "NetworkOrganizationUserSyncWorker: no network_organization for #{org_id}"
      return false
    end
    if action == :add
      add_role(user_uid, role_name)
    elsif action == :remove
      remove_role(user_uid, role_name)
    else
      # no need to `raise` here otherwise the worker will just keep retrying
      logger.error "NetworkOrganizationUserSyncWorker unsupported action: #{action}"
      return false
    end
  end

  private

  def get_network_organization(org_id)
    @network_organization = NetworkApi::Organization.find_by_external_id(org_id)
  end

  def add_role(user_uid, role_name)
    network_role = NetworkApi::Role.find_or_create_by_organization(
      @network_organization.id, role_name
    )
    NetworkApi::UsersRole.create_by_uid(
      user_uid: user_uid,
      role_id: network_role.id,
    )
  end

  def remove_role(user_uid, role_name)
    network_role = NetworkApi::Role.find_by_organization(
      @network_organization.id, role_name
    )
    return true if network_role.blank?

    NetworkApi::UsersRole.remove_by_uid(
      user_uid: user_uid,
      role_id: network_role.id,
    )
  end
end
