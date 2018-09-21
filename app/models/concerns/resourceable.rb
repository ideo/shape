module Resourceable
  extend ActiveSupport::Concern

  included do
    resourcify
    class_attribute :resourceable_roles
    class_attribute :edit_role
    class_attribute :content_edit_role
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

      %i[edit_role view_role content_edit_role].each do |role_type|
        send("#{role_type}=", args[role_type].to_sym) if args[role_type].present?
      end
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
    return true if user_or_group.has_cached_role?(Role::SUPER_ADMIN)
    raise_role_name_not_set(:edit_role) if self.class.edit_role.blank?
    user_or_group.has_role_by_identifier?(self.class.edit_role, resource_identifier)
  end

  def can_edit_content?(user_or_group)
    return true if can_edit?(user_or_group)
    return false if self.class.content_edit_role.blank?
    user_or_group.has_role_by_identifier?(self.class.content_edit_role, resource_identifier)
  end

  def can_view?(user_or_group)
    return true if can_edit?(user_or_group)
    return true if can_edit_content?(user_or_group)
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

  def editor_user_ids
    role_user_ids(Role::EDITOR)
  end

  def viewer_user_ids
    role_user_ids(Role::VIEWER)
  end

  # get all [role] users, both individual and via group, for this item/collection
  def role_user_ids(role_name)
    return unless editable_and_viewable?
    user_ids_for_role = UsersRole
                        .joins(:role)
                        .where(Role.arel_table[:resource_identifier].eq(resource_identifier))
                        .where(Role.arel_table[:name].eq(role_name))
                        .pluck(:user_id)
                        .uniq
    group_ids = send(role_name.to_s.pluralize)[:groups].pluck(:id)
    (user_ids_for_role + Group.where(id: group_ids).user_ids).uniq
  end

  def allowed_user_ids
    (editor_user_ids + viewer_user_ids).uniq
  end

  def editable_and_viewable?
    # right now just for Collections/Items
    self.class.edit_role == Role::EDITOR && self.class.view_role = Role::VIEWER
  end

  def requires_roles?
    # can be overridden e.g. by QuestionItem
    true
  end

  # NOTE: This should only ever be called on a newly created record, e.g. in CollectionCardBuilder
  def inherit_roles_from_parent!(parent = self.parent)
    return false unless requires_roles?
    return false unless parent.present?
    return false if roles.present?
    if parent.is_a? Collection::SubmissionsCollection
      role_parent = parent.submission_box
    else
      role_parent = parent
    end
    role_parent.roles.each do |role|
      new_role = role.duplicate!(assign_resource: self, dont_save: true)
      # special case: CONTENT_EDITOR is a special role (for now).
      # when creating child content, CONTENT_EDITORS become EDITORS
      new_role.name = Role::EDITOR if new_role.name.to_sym == Role::CONTENT_EDITOR
      new_role.save
    end
  end

  private

  def raise_role_name_not_set(role_name)
    raise StandardError, "Pass in `#{role_name}` to #{self.class.name}'s resourceable definition to use this method"
  end
end
