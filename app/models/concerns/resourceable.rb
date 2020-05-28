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

    def identifiers
      select(:id).map(&:resource_identifier)
    end

    # really meant to be used on an AR Relation, where `select` is just the relevant records
    def user_ids
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

    def roles_anchor_identifier_sql
      # placed here so it can be used within different services e.g. Collection.roles_anchor_identifier_sql
      %(
        CASE WHEN COALESCE(
          items.roles_anchor_collection_id,
          collections.roles_anchor_collection_id
        ) IS NOT NULL
        THEN
          CONCAT('Collection_', COALESCE(
            items.roles_anchor_collection_id,
            collections.roles_anchor_collection_id
          ))
        ELSE
          CONCAT(
            (CASE WHEN collection_cards.item_id IS NOT NULL THEN 'Item' ELSE 'Collection' END),
            '_',
            COALESCE(collection_cards.item_id, collection_cards.collection_id)
          )
        END
      )
    end
  end

  # Instance methods

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

  # returns true if resource's roles are equal to (or more inclusive than) self
  def includes_all_roles?(resource)
    return false unless item_or_collection? && resource.item_or_collection?

    mine = flattened_user_and_group_role_ids
    theirs = resource.flattened_user_and_group_role_ids

    %i[viewers editors].each do |role_name|
      my_role = mine[role_name]
      their_role = theirs[role_name]
      %i[users groups].each do |role_owner|
        my_ids = my_role.try(:[], role_owner) || []
        their_ids = their_role.try(:[], role_owner) || []
        return false unless (their_ids & my_ids).sort == their_ids.sort
      end
    end

    true
  end

  def flattened_user_and_group_role_ids
    list = anchored_roles
           .includes(:users, :groups)
           .pluck(User.arel_table[:id], Group.arel_table[:id], Role.arel_table[:name])
    result = HashWithIndifferentAccess.new
    list.each do |user_id, group_id, role_name|
      role_name = role_name.pluralize.to_sym
      result[role_name] ||= {}
      if user_id
        result[role_name][:users] ||= []
        result[role_name][:users] |= [user_id]
      end
      if group_id
        result[role_name][:groups] ||= []
        result[role_name][:groups] |= [group_id]
      end
    end
    result
  end

  def anchored_roles(viewing_organization_id: organization_id)
    return roles if is_a?(Group)
    return [] if common_viewable? && viewing_organization_id != organization_id

    roles_anchor.roles
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
    return true if common_viewable?
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

  def user_and_group_identifiers_with_view_access
    user_ids = role_user_ids([Role::VIEWER, Role::EDITOR]).map { |id| "User_#{id}" }
    group_ids = role_group_ids([Role::VIEWER, Role::EDITOR]).map { |id| "Group_#{id}" }
    user_ids + group_ids
  end

  def user_and_group_identifiers_with_edit_access
    user_ids = role_user_ids(Role::EDITOR).map { |id| "User_#{id}" }
    group_ids = role_group_ids(Role::EDITOR).map { |id| "Group_#{id}" }
    user_ids + group_ids
  end

  def search_user_ids
    # slightly different from allowed_user_ids because the search methods
    # intentionally separate user_ids and group_ids
    anchored_roles.includes(:users).pluck(User.arel_table[:id]).uniq.compact
  end

  def search_group_ids
    anchored_roles.includes(:groups).pluck(Group.arel_table[:id]).uniq.compact
  end

  # # get all [role] users, both individual and via group, for this item/collection
  def role_user_ids(role_name)
    return unless editable_and_viewable?

    UsersRole
      .joins(:role)
      .where(Role.arel_table[:resource_identifier].eq(roles_anchor_resource_identifier))
      .where(Role.arel_table[:name].in(role_name))
      .pluck(:user_id)
      .uniq
  end

  def role_group_ids(role_name)
    return unless editable_and_viewable?

    GroupsRole
      .joins(:role)
      .where(Role.arel_table[:resource_identifier].eq(roles_anchor_resource_identifier))
      .where(Role.arel_table[:name].in(role_name))
      .pluck(:group_id)
      .uniq
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
    previous_anchor_id = roles_anchor.id
    # NOTE: these next two steps have to happen back to back
    inherit_roles_from_parent!(roles_anchor)
    unanchor!
    return unless is_a?(Collection)

    # ensure that any existing children are also updated accordingly
    reanchor_children!(from: previous_anchor_id, to: id)
  end

  def unanchor!
    update_column(:roles_anchor_collection_id, nil)
    reload
  end

  def reanchor!(parent: self.parent, propagate: false)
    anchor_id = parent&.roles_anchor&.id
    return unless anchor_id

    unmark_as_private!
    # could be self or whatever this was anchored to
    update_columns(roles_anchor_collection_id: anchor_id, updated_at: Time.current)
    roles.destroy_all
    return unless propagate && is_a?(Collection)

    reanchor_children!(to: anchor_id)
  end

  def reanchor_children!(from: id, to: roles_anchor.id)
    [Item, Collection].each do |klass|
      klass
        .in_collection(self)
        .where(roles_anchor_collection_id: from)
        .update_all(roles_anchor_collection_id: to, updated_at: Time.current)
    end
  end

  def mark_as_private!(value = true)
    # slightly convoluted way of writing a jsonb_set update on self (#update won't work here)
    settings = { 'private': value, 'updated_at': Time.current }
    self.class.where(id: id).update_all(%(
      cached_attributes = jsonb_set(
        cached_attributes, '{cached_inheritance}', '#{settings.to_json}'::jsonb
      )
    ))
    # mark update_at and bust cache
    touch if value
    # make sure to set this in memory as well (saves having to do a `reload`)
    self.cached_inheritance = settings.as_json
  end

  def unmark_as_private!
    mark_as_private!(false)
  end

  def reanchor_if_incorrect_anchor!(parent: self.parent)
    # we've seen a roles anchor be set incorrectly, e.g. Collection X -> parent -> grandparent
    # even though `parent` has roles, `X` is somehow anchored to the grandparent;
    # may have been the result of a previous bug in add_role that was erroring out during role propagation...
    return false unless roles_anchor_collection_id.present?

    not_anchored_to_parent_roles = (
      parent.roles_anchor_collection_id.nil? &&
      roles_anchor_collection_id != parent.id
    )
    anchor_not_in_breadcrumb = !breadcrumb.include?(roles_anchor_collection_id)
    return false unless not_anchored_to_parent_roles || anchor_not_in_breadcrumb

    reanchor!(parent: parent, propagate: true)
    true
  end

  def remove_all_viewer_roles!
    unanchor_and_inherit_roles_from_anchor!
    (viewers[:users] + viewers[:groups]).each do |viewer|
      viewer.remove_role(Role::VIEWER, self)
    end
  end

  def private?
    return false if parent&.is_a?(Collection::UserCollection)

    # NOTE: this will return the cached value if found
    Roles::Inheritance.new(parent).private_child?(self)
  end

  def common_viewable?
    return if is_a?(Group)

    # `common_viewable` comes from cached_attributes
    # can also get set via CollectionCardRenderer to save from looking up the roles_anchor
    return common_viewable unless common_viewable.nil?

    roles_anchor&.common_viewable.present?
  end

  # these are defined here so that all resourceable types can return true/false
  # for being an Item or Collection
  def item_or_collection?
    item? || collection?
  end

  def item?
    is_a?(Item)
  end

  def collection?
    is_a?(Collection)
  end

  private

  # only makes sense to call this method if you have unanchored the resource
  def inherit_roles_from_parent!(parent = self.parent)
    return false unless requires_roles?
    return false unless parent.present?

    roles.destroy_all
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
