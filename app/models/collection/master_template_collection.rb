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

    def profile_template?
      organization.template_collection_id == id
    end
  end
end
