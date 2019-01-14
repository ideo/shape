module Roles
  class ModifyChildren
    def initialize(
      # this is the user who initiated this action, so we can check their permissions
      user: nil,
      role_name:,
      parent:,
      method:,
      subject_users: [],
      subject_groups: [],
      previous_anchor_id: nil
    )
      @user = user
      @subject_users = subject_users
      @subject_groups = subject_groups
      @parent = parent
      @role_name = role_name
      @previous_anchor_id = previous_anchor_id
      @method = method
    end

    def call
      return false unless %w[add remove].include? @method
      return if @parent.try(:children).blank?
      modify_children_roles(Collection.in_collection(@parent))
      modify_children_roles(Item.in_collection(@parent))
      true
    end

    private

    def modify_children_roles(children)
      # Find all children that are unanchored (have their own roles)
      # If the user can edit, then continue adding the roles
      children.where(roles_anchor_collection_id: nil).find_each do |child|
        next if child.is_a?(Collection) && child.submission? && child.submission_attrs['hidden']
        if @user.nil? || child.can_edit?(@user)
          # just alter the roles at this one level, since we are already searching through *all* levels of children
          params = {
            object: child,
            role_name: @role_name,
            users: @subject_users,
            groups: @subject_groups,
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
  end
end
