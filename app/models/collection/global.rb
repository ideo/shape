# Global collections are special generated collections that are required for the org
class Collection
  class Global < Collection
    def org_templates?
      organization.template_collection_id == id
    end

    def profiles?
      organization.profile_collection_id == id
    end

    def system_required?
      return true if profiles?
      # org templates collection is only required if it contains the profile_template
      # NOTE: could search all its children if they're required but seems like overkill?
      org_templates? && collection_ids.include?(organization.profile_template_id)
    end
  end
end
