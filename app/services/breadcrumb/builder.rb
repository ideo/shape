module Breadcrumb
  class Builder < SimpleService
    def initialize(object)
      @object = object
      @breadcrumb = []
    end

    def call
      calculate_breadcrumb
    end

    def self.for_parent(parent)
      return [] unless parent.present? && parent.is_a?(Breadcrumbable) && parent.breadcrumbable?

      @breadcrumb = parent.breadcrumb
      # easiest way to short circuit this for SubmissionsCollections which should not be in the breadcrumb trail
      @breadcrumb += [parent.id] unless parent.is_a? Collection::SubmissionsCollection
      @breadcrumb
    end

    private

    attr_reader :object, :breadcrumb

    def calculate_breadcrumb
      build
      @breadcrumb
    end

    def build
      return unless @object.is_a?(Breadcrumbable) && @object.breadcrumbable?

      @breadcrumb = self.class.for_parent(@object.parent)
    end
  end
end
