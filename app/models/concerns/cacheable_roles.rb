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
end
