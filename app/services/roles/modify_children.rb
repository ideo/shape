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
      @inheritance = Roles::Inheritance.new(@parent)
    end

    def call
      return false unless %w[add remove].include? @method
      modify_children_roles(Collection.in_collection(@parent))
      modify_children_roles(Item.in_collection(@parent))
      true
    end

    private

    def modify_children_roles(children)
      modify_unanchored_children(children)
      modify_anchored_children(children)
    end

    def modify_unanchored_children(children)
      # Find all children that are unanchored (have their own roles)
      children.where(roles_anchor_collection_id: nil).find_each do |child|
        # don't pass down any roles from parent -> child if the child is a hidden submission
        next if hidden_submission?(child)
        # If the user can edit, then continue adding the roles
        next unless @user.nil? || child.can_edit?(@user)
        # don't modify private children, other than unhidden submissions
        next unless will_inherit_from_parent?(child) || unhidden_submission?(child)

        # just alter the roles at this one level, since we are already searching through *all* levels of children
        params = {
          object: child,
          role_name: @role_name,
          users: @subject_users,
          groups: @subject_groups,
          propagate_to_children: false,
        }
        role_service = @method == 'add' ? Roles::MassAssign : Roles::MassRemove
        role_service.call(params)
      end
    end

    def hidden_submission?(child)
      child.is_a?(Collection) && child.submission? && child.submission_attrs['hidden']
    end

    def unhidden_submission?(child)
      child.is_a?(Collection) && child.submission? && !child.submission_attrs['hidden']
    end

    def will_inherit_from_parent?(child)
      add_identifiers = (@subject_users + @subject_groups).map { |i| Role.object_identifier(i) }
      @inheritance.inherit_from_parent?(child, add_identifiers: add_identifiers, role_name: @role_name)
    end

    def modify_anchored_children(children)
      return unless @previous_anchor_id.present?
      children
        .where(roles_anchor_collection_id: @previous_anchor_id)
        .update_all(roles_anchor_collection_id: @parent.id)
    end
  end
end
