module Roles
  class RemoveUserRolesFromOrganization < SimpleService
    def initialize(organization,
                   user)
      @organization = organization
      @user = user
    end

    def call
      remove_user_roles_from_organization
    end

    def remove_user_roles_from_organization
      RemoveUserRolesFromOrganizationWorker.perform_async(
        @organization.id,
        @user.id,
      )
    end
  end
end
