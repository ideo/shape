module Roles
  class Inheritance
    def initialize(parent)
      @parent = parent
    end

    def inherit_from_parent?(child, add_user_ids: [], role_name: '')
      # Yes if there are no child roles yet
      return true if child.roles.empty?

      if add_user_ids.empty? && role_name.blank?
        # generic case: check that both Editors and Viewers would inherit
        # NOTE: Role::CONTENT_EDITOR is not yet represented here, because it's
        # not a selectable role on the frontend.
        inherit_role_from_parent?(child, role_name: Role::EDITOR) &&
          inherit_role_from_parent?(child, role_name: Role::VIEWER)
      elsif role_name
        inherit_role_from_parent?(child, add_user_ids: add_user_ids, role_name: role_name)
      else
        false
      end
    end

    # if inherit is false for either role, then the child is "private"
    def private_child?(child)
      return false if @parent.nil?
      !inherit_from_parent?(child)
    end

    private

    def inherit_role_from_parent?(child, add_user_ids: [], role_name:)
      return true if child.same_roles_anchor? @parent
      @parent_allowed_user_ids = allowed_user_ids(@parent, role_name)
      @child_allowed_user_ids = allowed_user_ids(child, role_name)
      proposed_user_ids = (@child_allowed_user_ids + add_user_ids).uniq
      should_inherit?(proposed_user_ids)
    end

    # Tests to see if children permissions are same or more permissive than parent
    # If so, apply roles. If not, ignore this object.
    def should_inherit?(proposed_user_ids)
      # We need to check that the proposed_roles will be fully represented
      #  in the parent, e.g.
      #  TRUE: We are proposing [A, B, C] as editors, and [A, B, C ... (any others)] are parent editors
      #  FALSE: We are proposing [A, B, C] as editors, and [A, D] are parent editors
      intersection = @parent_allowed_user_ids & proposed_user_ids
      (@parent_allowed_user_ids - intersection).empty?
    end

    def allowed_user_ids(resource, role_name)
      if role_name == Role::EDITOR
        resource.editor_user_ids
      else
        # include both editors and viewers
        resource.allowed_user_ids
      end
    end
  end
end
