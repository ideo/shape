module Roles
  class Inheritance
    def initialize(parent)
      @parent = parent
    end

    def inherit_from_parent?(child, add_identifiers: [], remove_identifiers: [], role_name: '')
      # If we are proposing removing identifiers, we still want to check if it will become private
      return true if child.same_roles_anchor?(@parent) && remove_identifiers.blank?

      if add_identifiers.empty? && remove_identifiers.empty? && role_name.blank?
        # generic case: check that both Editors and Viewers would inherit
        # NOTE: Role::CONTENT_EDITOR is not yet represented here, because it's
        # not a selectable role on the frontend.
        inherit_role_from_parent?(child, role_name: Role::EDITOR) &&
          inherit_role_from_parent?(child, role_name: Role::VIEWER)
      elsif role_name
        @add_identifiers = add_identifiers
        @remove_identifiers = remove_identifiers
        inherit_role_from_parent?(child, role_name: role_name)
      else
        false
      end
    end

    # if inherit is false for either role, then the child is "private"
    def private_child?(child)
      return false if @parent.nil? || child.common_viewable?

      cached = Mashie.new(child.cached_inheritance)

      # special case, fix any messed up records
      child.reanchor_if_incorrect_anchor!(parent: @parent)

      if child.same_roles_anchor? @parent
        child.unmark_as_private! if cached.blank?
        return false unless cached&.private
      end

      # otherwise we only compute cached_inheritance if not already set.
      # e.g. will preserve having intentionally marked/unmarked as private
      if cached.blank?
        value = !inherit_from_parent?(child)
        child.mark_as_private!(value)
      end
      child.cached_inheritance['private']
    end

    private

    def inherit_role_from_parent?(child, role_name:)
      @parent_allowed_identifiers = allowed_identifiers(@parent, role_name)
      proposed_identifiers = allowed_identifiers(child, role_name)
      proposed_identifiers -= @remove_identifiers if @remove_identifiers.present?
      proposed_identifiers += @add_identifiers if @add_identifiers.present?
      proposed_identifiers.uniq!
      should_inherit?(proposed_identifiers)
    end

    # Tests to see if children permissions are same or more permissive than parent
    # If so, apply roles. If not, ignore this object.
    def should_inherit?(proposed_identifiers)
      # We need to check that the proposed_roles will be fully represented
      #  in the parent, e.g.
      #  TRUE: We are proposing [A, B, C] as editors, and [A, B, C ... (any others)] are parent editors
      #  FALSE: We are proposing [A, B, C] as editors, and [A, D] are parent editors
      intersection = @parent_allowed_identifiers & proposed_identifiers
      (@parent_allowed_identifiers - intersection).empty?
    end

    def allowed_identifiers(resource, role_name)
      if role_name == Role::EDITOR
        resource.user_and_group_identifiers_with_edit_access
      else
        # include both editors and viewers
        resource.user_and_group_identifiers_with_view_access
      end
    end
  end
end
