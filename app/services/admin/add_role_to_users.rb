module Admin
  class AddRoleToUsers < SimpleService
    attr_reader :added_users, :failed_users

    def initialize(users:)
      @users = users
      @added_users = []
      @failed_users = []
    end

    def call
      assign_role_to_users
      return failed_users.blank?
    end

    private

    def assign_role_to_users
      @users.each do |user|
        role = user.add_role(Role::SHAPE_ADMIN)
        if role.persisted?
          @added_users << user
        else
          @failed_users << user
        end
      end
    end
  end
end
