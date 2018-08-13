module Breadcrumbable
  extend ActiveSupport::Concern

  included do
    after_create :recalculate_breadcrumb!, if: :calculate_breadcrumb?
    before_update :calculate_breadcrumb
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

  # Returns an array of breadcrumb items that this user has permissions to see
  def breadcrumb_viewable_by(user = nil)
    return [] if user.blank? || breadcrumb.nil?
    breadcrumb_for_user(user).viewable
  end

  # Returns the singular breadcrumb item for this object
  def to_breadcrumb_item
    Breadcrumb::Builder.for_object(self)
  end

  # really just an alias for save since before_update will call calculate_breadcrumb
  def recalculate_breadcrumb!
    save
  end

  def breadcrumb_contains?(object: nil, id: nil, klass: nil)
    found = false
    if object
      found = breadcrumb.include?(object.to_breadcrumb_item)
    else
      breadcrumb.each do |crumb|
        if crumb[0] == klass && crumb[1] == id
          found = true
          break
        end
      end
    end
    found
  end

  private

  def calculate_breadcrumb
    self.breadcrumb = Breadcrumb::Builder.new(self).call
  end

  def breadcrumb_for_user(user)
    Breadcrumb::ForUser.new(
      breadcrumb,
      user,
    )
  end

  def calculate_breadcrumb?
    breadcrumb.blank?
  end
end
