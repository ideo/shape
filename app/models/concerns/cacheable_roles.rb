module CacheableRoles
  extend ActiveSupport::Concern

  def cached_roles_by_identifier
    @cached_roles_by_identifier ||= roles.map(&:identifier)
  end

  # Note: there is already a #has_cached_role? that Rolify adds,
  # but it requires instantiated objects to use it
  def has_role_by_identifier?(name, resource_identifier)
    cached_roles_by_identifier.include?(
      Role.role_identifier(
        role_name: name,
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
end
