module RolifyExtensions
  extend ActiveSupport::Concern

  def has_role_by_identifier?(role_name, resource_identifier)
    cached_roles_by_identifier.include?(
      Role.role_identifier(
        role_name: role_name,
        resource_identifier: resource_identifier,
      )
    )
  end

  # Override rolify has_role? and add_role methods to ensure
  # we always pass root class, not STI child class - which it can't handle
  def has_role?(role_name, resource = nil)
    return super(role_name) if resource.blank?
    super(role_name, resource.becomes(resource.resourceable_class))
  end

  def add_role(role_name, resource = nil)
    return super(role_name) if resource.blank?
    super(role_name, resource.becomes(resource.resourceable_class))
  end

  def remove_role(role_name, resource = nil)
    return super(role_name) if resource.blank?
    super(role_name, resource.becomes(resource.resourceable_class))
  end

  # This includes all roles a user explicitly has
  # And all roles they get through their group membership
  def cached_roles_by_identifier
    @cached_roles_by_identifier ||= (
      roles.map(&:identifier) + current_org_groups_roles_identifiers
    ).uniq
  end

  def reset_cached_roles!
    @cached_roles_by_identifier = nil
  end
end
