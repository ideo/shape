module RolifyExtensions
  extend ActiveSupport::Concern

  def has_role_by_identifier?(role_name, resource_identifier)
    # https://www.justinweiss.com/articles/4-simple-memoization-patterns-in-ruby-and-one-gem/
    @has_role_by_identifier ||= Hash.new do |h, key|
      role_name = key.first
      resource_identifier = key.last
      role = rolify_roles.where(
        name: role_name,
        resource_identifier: resource_identifier,
      ).first
      if is_a?(User)
        h[key] = role.present? || role_via_org_groups(role_name, resource_identifier).present?
      elsif is_a?(Group)
        h[key] = role.present?
      else
        raise "RolifyExtension: Unsupported model '#{self.class.name}' for cached_roles_by_identifier"
      end
    end
    @has_role_by_identifier[[role_name.to_s, resource_identifier]]
  end

  def precache_roles_for(role_names, resources)
    return unless @has_role_by_identifier.present? && is_a?(User)
    return unless resources.present?
    resource_identifiers = resources.map(&:roles_anchor_resource_identifier).uniq
    roles = rolify_roles.where(
      name: role_names,
      resource_identifier: resource_identifiers,
    )
    roles += role_via_current_org_groups(role_names, resource_identifiers)

    found = {}
    roles.each do |role|
      @has_role_by_identifier[[role.name, role.resource_identifier]] = true
      found[[role.name, role.resource_identifier]] = true
    end
    role_names.each do |role_name|
      resource_identifiers.each do |r|
        unless found[[role_name.to_s, r]]
          @has_role_by_identifier[[role_name.to_s, r]] = false
        end
      end
    end

    @has_role_by_identifier
  end

  # Override rolify `has_role?` and `add_role` methods to ensure
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

  def has_cached_role?(role_name)
    @has_cached_role ||= Hash.new do |h, key|
      h[key] = has_role?(role_name)
    end
    @has_cached_role[role_name.to_s]
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
    # anchored items/collections aren't allowed to have their own roles, you need to unanchor them first
    return false if resource.roles_anchor_collection_id.present?

    existing = existing_resource_role_for_self(role)
    # if we're adding someone as editor/admin who's previously a different role
    should_upgrade = (
      role.name.to_sym == resource.class.edit_role &&
      existing &&
      existing.name.to_sym != resource.class.edit_role
    )
    # this will re-start the add_role process, after first removing user's viewer role
    return upgrade_to_edit_role(resource) if should_upgrade
    return existing if existing.present?
    if is_a?(User)
      role.users << self
    elsif is_a?(Group)
      role.groups << self
    else
      raise "RolifyExtension: Unsupported model '#{self.class.name}' for add_role"
    end
    sync_groups_after_adding(role) if is_a?(User)
    after_role_update(role)
    role
  end

  def remove_role(role_name, resource = nil)
    # anchored items/collections aren't allowed to have their own roles, you need to unanchor them first
    return false if resource.roles_anchor_collection_id.present?

    if resource.blank?
      role = Role.where(name: role_name, resource: nil).first
    else
      role = Role.for_resource(resource).where(name: role_name).first
    end
    return [] unless role.present?
    # `remove_role` will too aggressively destroy the entire role, so just remove objects directly
    if is_a?(User)
      role.users.destroy(self)
    elsif is_a?(Group)
      role.groups.destroy(self)
    else
      raise "RolifyExtension: Unsupported model '#{self.class.name}' for remove_role"
    end
    return role if resource.blank?
    sync_groups_after_removing(role) if is_a?(User)
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

  def upgrade_to_edit_role(resource)
    return unless is_a? User
    return true if resource.can_edit? self

    other_roles = Role
                  .for_resource(resource)
                  .where.not(name: resource.class.edit_role)
    other_roles.each do |role|
      # `remove_role` will too aggressively destroy the entire role, so just remove the user
      role.users.destroy(self) if role.present?
    end
    add_role(resource.class.edit_role, resource)
  end

  def reset_cached_roles!
    @has_role_by_identifier = nil
    @has_cached_role = nil
  end
end
