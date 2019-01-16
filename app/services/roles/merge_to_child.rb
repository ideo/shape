module Roles
  class MergeToChild < SimpleService
    def initialize(parent:, child:)
      @parent = parent
      @child = child
    end

    def call
      merge_parent_roles_to_child
    end

    private

    def merge_parent_roles_to_child
      # if same roles anchor then they already have the same roles
      return if @child.same_roles_anchor? @parent

      # if parent includes all roles, child can just reanchor to parent and remove its own roles
      if @parent.includes_all_roles? @child
        @child.update(roles_anchor_collection_id: @parent.roles_anchor.id)
        @child.roles.destroy_all
        return
      end

      # otherwise assign each role from parent to child so that child now has the merged combo
      parent_permissions.each do |role_name, users_and_groups|
        Roles::MassAssign.new(
          object: @child,
          role_name: role_name,
          users: users_and_groups[:users],
          groups: users_and_groups[:groups],
          propagate_to_children: true,
        ).call
      end
    end

    def parent_permissions
      {
        Role::EDITOR => @parent.editors,
        Role::VIEWER => @parent.viewers,
      }
    end
  end
end
