module Breadcrumb
  class Builder
    def initialize(object)
      @object = object
      @breadcrumb = []
    end

    def call
      calculate_breadcrumb
    end

    def self.for_object(object)
      [
        object.class.base_class.to_s,
        object.id,
        object.breadcrumb_title,
      ]
    end

    private

    attr_reader :object, :breadcrumb

    def calculate_breadcrumb
      return breadcrumb if object.parent.blank?

      build(object)

      # Reverse breadcrumb so it is in the correct order
      breadcrumb.reverse!
    end

    def build(object)
      return unless object.is_a?(Breadcrumbable)
      breadcrumb << Breadcrumb::Builder.for_object(object)

      return unless object.parent.present?
      build(object.parent)
    end
  end
end
