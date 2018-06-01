module Resourceable
  extend ActiveSupport::Concern

  included do
    resourcify
    class_attribute :resourceable_roles
    class_attribute :edit_role
    class_attribute :view_role
  end

  class_methods do
    def resourceable(**args)
      if args[:roles].present?
        self.resourceable_roles = args[:roles]

        args[:roles].each do |role_name|
          # Define a pluralized method with this role on the class
          # e.g. if given [:viewer], the method would be .viewers
          # Returns users and groups
          define_dynamic_role_method(role_name)
        end
      end

      self.edit_role = args[:edit_role].to_sym if args[:edit_role].present?
      self.view_role = args[:view_role].to_sym if args[:view_role].present?
    end

    def define_dynamic_role_method(role_name)
      # Returns a hash of users and groups that match this role
      # --> { users: [...users], groups: [..groups] }
      # e.g. .viewers returns all users and groups that are viewers
      #      .editors[:users] returns all users that are editors
      define_method role_name.to_s.pluralize.to_sym do
        # There's only one role with a name per resource
        role = roles.where(name: role_name)
                    .includes(:users, :groups)
                    .first

        return { users: [], groups: [] } if role.blank?

        { users: role.users, groups: role.groups }
      end
    end

    # really meant to be used on an AR Relation, where `select` is just the relevant records
    def user_ids
      identifiers = select(:id).map(&:resource_identifier)
      UsersRole
        .joins(:role)
        .where(Role.arel_table[:resource_identifier].in(identifiers))
        .pluck(:user_id)
        .uniq
    end
  end

  def can_edit?(user_or_group)
    raise_role_name_not_set(:edit_role) if self.class.edit_role.blank?
    user_or_group.has_role_by_identifier?(self.class.edit_role, resource_identifier)
  end

  def can_view?(user_or_group)
    return true if can_edit?(user_or_group)
    raise_role_name_not_set(:view_role) if self.class.view_role.blank?
    user_or_group.has_role_by_identifier?(self.class.view_role, resource_identifier)
  end

  def resourceable_class
    self.class
  end

  def resource_identifier
    Role.object_identifier(self)
  end

  # combine all attached user_ids using self.user_ids method
  def user_ids
    self.class.where(id: id).user_ids
  end

  # get all editors/viewers, both individual and via group, for this item/collection
  def allowed_user_ids
    return unless is_a?(Collection) || is_a?(Item)
    group_ids = editors[:groups].pluck(:id) + viewers[:groups].pluck(:id)
    (user_ids + Group.where(id: group_ids).user_ids).uniq
  end

  # NOTE: This should only ever be called on a newly created record, e.g. in CollectionCardBuilder
  def inherit_roles_from_parent!
    return false unless parent.present?
    return false if roles.present?
    parent.roles.each do |role|
      role.duplicate!(assign_resource: self)
    end
  end

  private

  def raise_role_name_not_set(role_name)
    raise StandardError, "Pass in `#{role_name}` to #{self.class.name}'s resourceable definition to use this method"
  end
end
