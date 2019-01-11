module Roles
  class AddToChildren
    def initialize(
      # this is the user who initiated this action, so we can check their permissions
      user: nil,
      role_name:,
      parent:,
      users_to_add: [],
      groups_to_add: [],
      previous_anchor_id: nil,
      method:
    )
      @user = user
      @users_to_add = users_to_add
      @groups_to_add = groups_to_add
      @parent = parent
      @role_name = role_name
      @previous_anchor_id = previous_anchor_id
      @method = method
      # @inheritance = Roles::Inheritance.new(parent)
    end

    def call
      return if @parent.try(:children).blank?
      add_roles_to_children(Collection.in_collection(@parent))
      add_roles_to_children(Item.in_collection(@parent))
    end

    private

    def add_roles_to_children(children)
      # Find all children that are unanchored (have their own roles)
      # If the user can edit, then continue adding the roles
      children.where(roles_anchor_collection_id: nil).find_each do |child|
        if @user.nil? || child.can_edit?(@user)
          # just alter the roles at this one level, since we are already searching through *all* levels of children
          params = {
            object: child,
            role_name: @role_name,
            users: @users_to_add,
            groups: @groups_to_add,
            propagate_to_children: false,
          }
          role_service = @method == 'add' ? Roles::MassAssign : Roles::MassRemove
          role_service.new(params).call
        end
      end

      return unless @previous_anchor_id.present?
      children
        .where(roles_anchor_collection_id: @previous_anchor_id)
        .update_all(roles_anchor_collection_id: @parent.id)
    end

    # def add_roles_to_children
    #   children.all? do |child|
    #     if @inheritance.inherit_from_parent?(child, add_user_ids: all_user_ids, role_name: @role_name)
    #       save_new_child_roles(child)
    #       recursively_add_roles_to_grandchildren(child)
    #     else
    #       true
    #     end
    #   end
    # end
    #
    # def recursively_add_roles_to_grandchildren(child)
    #   if child.respond_to?(:children) &&
    #      child.children.present?
    #     Roles::AddToChildren.new(
    #       role_name: @role_name,
    #       parent: child,
    #       users_to_add: @users_to_add,
    #       groups_to_add: @groups_to_add,
    #     ).call
    #   else
    #     true
    #   end
    # end
    #
    # def all_user_ids
    #   (@users_to_add.map(&:id) + @groups_to_add.map(&:user_ids)).flatten.uniq
    # end
    #
    # def save_new_child_roles(child)
    #   Roles::MassAssign.new(
    #     object: child,
    #     role_name: @role_name,
    #     users: @users_to_add,
    #     groups: @groups_to_add,
    #     propagate_to_children: false,
    #   ).call
    # end
    #
    # def children
    #   return [] unless @parent.respond_to?(:children)
    #
    #   @parent.children
    # end
  end
end
