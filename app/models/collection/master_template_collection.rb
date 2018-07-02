class Collection
  class MasterTemplateCollection < Collection
    def name
      'Template'
    end

    def searchable?
      false
    end

    def should_index?
      false
    end

    def breadcrumbable?
      false
    end
  end
end
