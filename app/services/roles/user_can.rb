module Roles
  class UserCan
    def initialize(user)
      @user = user
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

    attr_reader :user

    def has_role?(name, resource_identifier)
      user.has_role_by_identifier?(name, resource_identifier)
    end
  end
end
