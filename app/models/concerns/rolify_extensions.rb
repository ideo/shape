module RolifyExtensions
  extend ActiveSupport::Concern

  def has_role_by_identifier?(role_name, resource_identifier)
    cached_roles_by_identifier.include?(
      Role.identifier(
        role_name: role_name,
        resource_identifier: resource_identifier,
      )
    )
  end

  # Override rolify has_role? and add_role methods to ensure
  # we always pass root class, not STI child class - which it can't handle
  def has_role?(role_name, resource = nil)
    has_role = if resource.blank?
                 super(role_name)
               else
                 super(role_name, resource.becomes(resource.resourceable_class))
               end

    return has_role if has_role || !is_a?(Group) || resource.blank?

    # If group, the role could be in the other direction
    # TODO: adapt so that can also handle new records, not just fully persisted objects
    roles_to_resources
      .where(Role.arel_table[:name].eq(role_name))
      .where(
        Role.arel_table[:resource_identifier].eq(
          Role.object_identifier(resource),
        ),
      ).count
      .positive?
  end

  # Rolify was super slow in adding roles once there became thousands,
  # so we wrote our own method
  def add_role(role_name, resource = nil)
    role = Role.find_or_create(role_name, resource)
    return add_resource_role(role, resource) if resource.present?
    return role unless is_a?(User)
    # otherwise if no resource, just create a UsersRole linking to the role
    UsersRole.find_or_create_by(role: role, user: self)
    role
  # rubocop:disable Lint/HandleExceptions
  rescue ActiveRecord::RecordNotUnique
    # rescue if we already added user - as it doesn't matter
    # rubocop:enable Lint/HandleExceptions
  end

  def add_resource_role(role, resource)
    existing = existing_resource_role_for_self(role)
    # if we're adding someone as editor who's previously a viewer
    should_upgrade = (
      role.name.to_sym == Role::EDITOR &&
      existing &&
      existing.name.to_sym == Role::VIEWER
    )
    # this will re-start the add_role process, after first removing user's viewer role
    return upgrade_to_editor_role(resource) if should_upgrade
    return existing if existing.present?
    if is_a?(User)
      role.users << self
    elsif is_a?(Group)
      role.groups << self
    else
      raise "RolifyExtension: Unsupported model '#{self.class.name}' for add_role"
    end
    after_role_update(role)
    role
  end

  def remove_role(role_name, resource = nil)
    return super(role_name) if resource.blank?
    role = Role.for_resource(resource).where(name: role_name).first
    return [] unless role.present?
    # `remove_role` will too aggressively destroy the entire role, so just remove objects directly
    if is_a?(User)
      role.users.destroy(self)
    elsif is_a?(Group)
      role.groups.destroy(self)
    else
      raise "RolifyExtension: Unsupported model '#{self.class.name}' for remove_role"
    end
    after_role_update(role)
    role
  end

  def existing_resource_role_for_self(role)
    role_type = is_a?(User) ? :users : :groups
    # lookup role.users / role.groups to find self
    return role if role.send(role_type).include? self
    existing_other_role_for_self(role, role_type)
  end

  def existing_other_role_for_self(role, role_type)
    return false if role.resource.blank?
    found = nil
    # find other roles on this resource, e.g. if we're adding member role, look up admins
    Role.for_resource(role.resource).each do |r|
      found ||= r if r.send(role_type).include? self
    end
    found
  end

  def upgrade_to_editor_role(resource)
    return unless is_a? User
    role = Role.for_resource(resource).where(name: Role::VIEWER).first
    # `remove_role` will too aggressively destroy the entire role, so just remove the user
    role.users.destroy(self) if role.present?
    add_role(Role::EDITOR, resource)
  end

  # This includes all roles a user explicitly has
  # And all roles they get through their group membership
  def cached_roles_by_identifier
    @cached_roles_by_identifier ||= begin
      if is_a?(User)
        (roles.map(&:identifier) + current_org_groups_roles_identifiers)
      elsif is_a?(Group)
        roles_to_resources.map(&:identifier)
      else
        raise "RolifyExtension: Unsupported model '#{self.class.name}' for cached_roles_by_identifier"
      end
    end.uniq
  end

  def reset_cached_roles!
    @cached_roles_by_identifier = nil
  end
end
