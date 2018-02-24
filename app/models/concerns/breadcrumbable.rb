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

  # Override this method in any classes to restrict
  # this object from the breadcrumb
  def breadcrumbable?
    true
  end

  def breadcrumb_for_user(user = nil)
    return [] if user.blank? || breadcrumb.nil?

    Breadcrumb::ForUser(breadcrumb, user).call
  end

  def recalculate_breadcrumb!
    self.breadcrumb = Breadcrumb::Builder.new(self).call
    save
    breadcrumb
  end

  private

  def calculate_breadcrumb?
    breadcrumb.nil?
  end
end
