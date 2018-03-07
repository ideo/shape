module Resourceable
  extend ActiveSupport::Concern

  included do
    resourcify
  end

  class_methods do
    def resourceable(**args)
      if args[:roles].present?
        args[:roles].each do |role_name|
          # Define a pluralized method with this role on the class
          # e.g. if given [:viewer], the method would be .viewers
          define_role_method(role_name)
        end
      end
    end

    def define_role_method(role_name)
      define_method role_name.to_s.pluralize.to_sym do
        role = role_with_name(role_name)
        return [] if role.blank?

        User.joins(:users_roles)
            .where(UsersRole.arel_table[:role_id].eq(role.id))
      end
    end
  end

  def role_with_name(role_name)
    roles.find_by(name: role_name)
  end
end
