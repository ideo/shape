module Roles
  class UserCan
    def initialize(user)
      @user = user
      load_and_cache_user_roles
    end

    # Right now these methods only return true if role is directly applied,
    # it doesn't traverse object inheritance chain

    def view?(object_identifier)
      has_role?(Role::VIEWER, object_identifier) || edit?(object_identifier)
    end

    def edit?(object_identifier)
      has_role?(Role::EDITOR, object_identifier)
    end

    def admin?(object_identifier)
      has_role?(Role::ADMIN, object_identifier)
    end

    def member?(object_identifier)
      has_role?(Role::MEMBER, object_identifier)
    end

    private

    attr_reader :user, :cached_roles

    def has_role?(name, resource_identifier)
      cached_roles.include?(
        Role.role_identifier(
          role_name: name,
          resource_identifier: resource_identifier,
        )
      )
    end

    def load_and_cache_user_roles
      return cached_roles unless cached_roles.nil?

      @cached_roles = user.roles.map(&:identifier)
    end
  end
end
