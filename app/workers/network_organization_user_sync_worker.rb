class NetworkOrganizationUserSyncWorker < BaseWorker
  def perform(user_uid, org_id, role_name, action)
    start_worker_process do
      forkperform(user_uid, org_id, role_name, action)
    end
  end

  def forkperform(user_uid, org_id, role_name, action)
    action = action.to_sym
    if action == :add
      add_role(user_uid, org_id, role_name)
    elsif action == :remove
      remove_role(user_uid, org_id, role_name)
    else
      raise "NetworkOrganizationUserSyncWorker unsupported action: #{action}"
    end
  end

  private

  def add_role(user_uid, org_id, role_name)
    network_organization = NetworkApi::Organization.find_by_external_id(org_id)
    network_role = NetworkApi::Role.find_or_create_by_organization(
      network_organization.id, role_name
    )
    NetworkApi::UsersRole.create_by_uid(
      user_uid: user_uid,
      role_id: network_role.id,
    )
  end

  def remove_role(user_uid, org_id, role_name)
    network_organization = NetworkApi::Organization.find_by_external_id(org_id)
    network_role = NetworkApi::Role.find_by_organization(
      network_organization.id, role_name
    )
    return true if network_role.blank?
    NetworkApi::UsersRole.remove_by_uid(
      user_uid: user_uid,
      role_id: network_role.id,
    )
  end
end
