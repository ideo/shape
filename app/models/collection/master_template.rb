class Collection
  class MasterTemplate < Collection
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
