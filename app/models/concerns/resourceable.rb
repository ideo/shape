module Resourceable
  extend ActiveSupport::Concern

  included do
    resourcify
    class_attribute :resourceable_roles
    class_attribute :edit_role
    class_attribute :view_role
  end

  class_methods do
    def resourceable(**args)
      if args[:roles].present?
        self.resourceable_roles = args[:roles]

        args[:roles].each do |role_name|
          # Define a pluralized method with this role on the class
          # e.g. if given [:viewer], the method would be .viewers
          define_dynamic_role_method(role_name)

          # An additional method that returns user ids, e.g. viewer_ids
          define_dynamic_role_ids_method(role_name)
        end
      end

      self.edit_role = args[:edit_role].to_sym if args[:edit_role].present?
      self.view_role = args[:view_role].to_sym if args[:view_role].present?
    end

    def define_dynamic_role_method(role_name)
      define_method role_name.to_s.pluralize.to_sym do
        role = role_with_name(role_name)
        return [] if role.blank?

        User.joins(:users_roles)
            .where(UsersRole.arel_table[:role_id].eq(role.id))
      end
    end

    def define_dynamic_role_ids_method(role_name)
      define_method "#{role_name}_ids".to_s.to_sym do
        role = role_with_name(role_name)
        return [] if role.blank?

        User.joins(:users_roles)
            .where(UsersRole.arel_table[:role_id].eq(role.id))
            .pluck(:id)
      end
    end
  end

  def can_edit?(user)
    raise_role_name_not_set(:edit_role) if self.class.edit_role.blank?
    user.has_role_by_identifier?(self.class.edit_role, resource_identifier)
  end

  def can_view?(user)
    return true if can_edit?(user)
    raise_role_name_not_set(:view_role) if self.class.view_role.blank?
    user.has_role_by_identifier?(self.class.view_role, resource_identifier)
  end

  def resourceable_class
    self.class
  end

  private

  def role_with_name(role_name)
    roles.find_by(name: role_name)
  end

  def resource_identifier
    Role.object_identifier(self)
  end

  def raise_role_name_not_set(role_name)
    raise StandardError, "Pass in `#{role_name}` to #{self.class.name}'s resourceable definition to use this method"
  end
end
