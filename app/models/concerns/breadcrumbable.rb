module Breadcrumbable
  extend ActiveSupport::Concern

  included do
    after_create :recalculate_breadcrumb!, if: :calculate_breadcrumb?
  end

  class_methods do
    # Helpers to add breadcrumb field to any model
    #
    # e.g. in a migration:
    # def up; Item.add_breadcrumb_column!; end

    def add_breadcrumb_column!
      connection.add_column table_name, :breadcrumb, :jsonb
    end

    def remove_breadcrumb_column!
      connection.remove_column table_name, :breadcrumb
    end
  end

  # Returns an array of breadcrumb items that this user has permissions to see
  def breadcrumb_viewable_by(user = nil)
    return [] if user.blank? || breadcrumb.nil?

    breadcrumb_for_user(user).viewable
  end

  def can_view?(user)
    breadcrumb_for_user(user).can_edit_item?(to_breadcrumb_item)
  end

  def can_edit?(user)
    breadcrumb_for_user(user).can_edit_item?(to_breadcrumb_item)
  end

  # Returns the singular breadcrumb item for this object
  def to_breadcrumb_item
    Breadcrumb::Builder.for_object(self)
  end

  def recalculate_breadcrumb!
    self.breadcrumb = Breadcrumb::Builder.new(self).call
    save
    breadcrumb
  end

  private

  def breadcrumb_for_user(user)
    Breadcrumb::ForUser.new(
      breadcrumb,
      user,
    )
  end

  def calculate_breadcrumb?
    breadcrumb.nil?
  end
end
