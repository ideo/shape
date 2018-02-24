module Breadcrumb
  class Builder

    attr_reader :breadcrumb

    def initialize(object)
      @object = object
      @breadcrumb = []
    end

    def call
      calculate_breadcrumb
    end

    private

    attr_reader :object

    def calculate_breadcrumb
      return breadcrumb if object.parent.blank?

      build(object)

      # Reverse breadcrumb so it is in the correct order
      breadcrumb.reverse!
    end

    def build(object)
      return unless object.is_a?(Breadcrumbable)
      # Check to make sure this item is allowed in the breadcrumb
      breadcrumb << object_breadcrumb(object) if object.breadcrumbable?

      return unless object.parent.present?
      build(object.parent)
    end

    def object_breadcrumb(object)
      [
        object.class.base_class.to_s,
        object.id,
        object.breadcrumb_title,
      ]
    end
  end
end
