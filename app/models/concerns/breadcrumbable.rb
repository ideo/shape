module Breadcrumbable
  extend ActiveSupport::Concern

  included do
    before_save :calculate_breadcrumb, if: :calculate_breadcrumb?
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

  def breadcrumb_for_user(user)
    content_can = Permissions::UserCan.new(user)
    can_view = false

    breadcrumb.select do |breadcrumb_item|
      # If we haven't reached an item they can view,
      # check to see if they can see it
      if can_view
        true
      else
        can_view = content_can.view?(breadcrumb_item.first)
      end
    end
  end

  def breadcrumb_data
    [ Role.object_identifier(self), breadcrumb_title ]
  end

  def reset_breadcrumb!
    self.breadcrumb = nil
  end

  private

  def calculate_breadcrumb?
    breadcrumb.nil?
  end

  def calculate_breadcrumb
    return if parent.blank?
    self.breadcrumb = []
    build_breadcrumb(self)
    # Reverse breadcrumb so it is in the correct order
    breadcrumb.reverse!
  end

  def build_breadcrumb(obj)
    return unless obj.is_a?(Breadcrumbable)
    breadcrumb << obj.breadcrumb_data

    return unless obj.parent.present?
    build_breadcrumb(obj.parent)
  end

  def breadcrumb_title
    %i[name title].each do |attr|
      return send(attr) if respond_to?(attr)
    end
  end
end
