module Roles
  class Inheritance
    def initialize(parent)
      @parent = parent
    end

    def inherit_from_parent?(child, add_identifiers: [], remove_identifiers: [], role_name: '')
      # Yes if there are no child roles yet
      return true if child.same_roles_anchor?(@parent)
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
      return false if @parent.nil?
      cached = child.cached_inheritance
      if child.same_roles_anchor? @parent
        if cached.present? && cached['private']
          child.cached_inheritance = { private: false, updated_at: Time.current }
          child.save
        end
        return false
      end
      max_updated = [@parent.roles.maximum(:updated_at) || 1.year.ago, child.roles.maximum(:updated_at) || 1.year.ago].max
      if !cached || !cached['updated_at'] || cached['updated_at'].to_time.to_i < max_updated.to_i
        child.cached_inheritance = {
          updated_at: max_updated,
          private: !inherit_from_parent?(child),
        }
        child.save
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
