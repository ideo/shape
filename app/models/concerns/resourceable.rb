module Resourceable
  extend ActiveSupport::Concern

  included do
    resourcify
    class_attribute :resourceable_roles
    class_attribute :edit_role
    class_attribute :content_edit_role
    class_attribute :view_role

    belongs_to :roles_anchor_collection, class_name: 'Collection', optional: true
    after_commit :reanchor_if_no_roles!, unless: :destroyed?
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
        role = anchored_roles.where(name: role_name)
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

    # more global way to query resources where you have ANY role (user or group)
    def viewable_by(user, organization)
      group_ids = user.organization_group_ids(organization)
      joined = all.left_joins(roles: %i[users_roles groups_roles])
      joined.where(UsersRole.arel_table[:user_id].eq(user.id)).or(
        joined.where(GroupsRole.arel_table[:group_id].in(group_ids)),
      ).distinct # because of left joins
    end
  end

  def roles_anchor
    roles_anchor_collection || self
  end

  def reanchor_if_no_roles!
    return unless item_or_collection?
    return unless parent.present? && roles.empty? && roles_anchor_collection_id.nil?
    # sort of a catch for items to automatically inherit parent roles_anchor if no roles exist
    # generally should only be after create
    reanchor!
  end

  def roles_anchor_resource_identifier
    return resource_identifier if roles_anchor_collection_id.nil?
    "Collection_#{roles_anchor_collection_id}"
  end

  def same_roles_anchor?(resource)
    roles_anchor_resource_identifier == resource.roles_anchor_resource_identifier
  end

  def includes_all_roles?(resource)
    return false unless item_or_collection? && resource.item_or_collection?
    %i[viewers editors].each do |role_name|
      my_role = send(role_name)
      their_role = resource.send(role_name)
      %i[users groups].each do |role_owner|
        mine = my_role.try(:[], role_owner).pluck(:id)
        theirs = their_role.try(:[], role_owner).pluck(:id)
        return false unless (mine & theirs) == theirs
      end
    end
    true
  end

  def anchored_roles
    return roles if is_a?(Group)
    roles_anchor.roles
  end

  def item_or_collection?
    is_a?(Item) || is_a?(Collection)
  end

  def can_edit?(user_or_group)
    return true if user_or_group.has_cached_role?(Role::SUPER_ADMIN)
    raise_role_name_not_set(:edit_role) if self.class.edit_role.blank?
    user_or_group.has_role_by_identifier?(self.class.edit_role, roles_anchor_resource_identifier)
  end

  def can_edit_content?(user_or_group)
    return true if can_edit?(user_or_group)
    return false if self.class.content_edit_role.blank?
    user_or_group.has_role_by_identifier?(self.class.content_edit_role, roles_anchor_resource_identifier)
  end

  def can_view?(user_or_group)
    return true if can_edit?(user_or_group)
    return true if can_edit_content?(user_or_group)
    raise_role_name_not_set(:view_role) if self.class.view_role.blank?
    user_or_group.has_role_by_identifier?(self.class.view_role, roles_anchor_resource_identifier)
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

  def search_user_ids
    # slightly different from allowed_user_ids because the search methods
    # intentionally separate user_ids and group_ids
    (editors[:users].pluck(:id) + viewers[:users].pluck(:id)).uniq
  end

  def search_group_ids
    (editors[:groups].pluck(:id) + viewers[:groups].pluck(:id)).uniq
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

  def inherit_roles_anchor_from_parent!(parent = self.parent)
    update_column(:roles_anchor_collection_id, parent.roles_anchor.id)
    reload
  end

  # Should either be called on a new record, or in MassAssign where it properly modifies children roles
  def unanchor_and_inherit_roles_from_anchor!
    # NOTE: these next two steps have to happen back to back
    inherit_roles_from_parent!(roles_anchor)
    unanchor!
  end

  def unanchor!
    update_column(:roles_anchor_collection_id, nil)
    reload
  end

  def reanchor!(parent: self.parent, propagate: false)
    anchor_id = parent&.roles_anchor&.id
    return unless anchor_id
    update_column(:roles_anchor_collection_id, anchor_id)
    touch
    return unless propagate && is_a?(Collection)
    roles.destroy_all
    [Item, Collection].each do |klass|
      klass
        .in_collection(self)
        .where(roles_anchor_collection_id: id)
        .update_all(roles_anchor_collection_id: anchor_id, updated_at: Time.current)
    end
  end

  def remove_all_viewer_roles
    (viewers[:users] + viewers[:groups]).each do |viewer|
      viewer.remove_role(Role::VIEWER, self)
    end
  end

  private

  # only makes sense to call this method if there are no roles and you have unanchored the resource
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
    reload
  end

  def raise_role_name_not_set(role_name)
    raise StandardError, "Pass in `#{role_name}` to #{self.class.name}'s resourceable definition to use this method"
  end
end
