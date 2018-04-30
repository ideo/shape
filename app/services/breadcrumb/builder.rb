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
      build(object)
      @breadcrumb
    end

    def build(object)
      return unless object.is_a?(Breadcrumbable) && object.breadcrumbable?
      @breadcrumb << Breadcrumb::Builder.for_object(object)
      parent = object.parent
      return unless parent.present? && parent.is_a?(Breadcrumbable)
      @breadcrumb = (parent.breadcrumb + @breadcrumb)
    end
  end
end
