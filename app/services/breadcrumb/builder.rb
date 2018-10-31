module Breadcrumb
  class Builder < SimpleService
    def initialize(object)
      @object = object
      @breadcrumb = []
    end

    def call
      calculate_breadcrumb
    end

    private

    attr_reader :object, :breadcrumb

    def calculate_breadcrumb
      build(object)
      @breadcrumb
    end

    def build(object)
      return unless object.is_a?(Breadcrumbable) && object.breadcrumbable?
      parent = object.parent
      return [] unless parent.present? && parent.is_a?(Breadcrumbable) && parent.breadcrumbable?
      @breadcrumb = parent.breadcrumb
      # easiest way to short circuit this for SubmissionsCollections which should not be in the breadcrumb trail
      @breadcrumb += [parent.id] unless parent.is_a? Collection::SubmissionsCollection
      @breadcrumb
    end
  end
end
