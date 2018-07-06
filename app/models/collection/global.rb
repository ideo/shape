# Global collections are special generated collections that are required for the org
class Collection
  class Global < Collection
    def org_templates?
      organization.template_collection_id == id
    end

    def profiles?
      organization.profile_collection_id == id
    end
  end
end
