# Global collections are special generated collections that are required for the org
class Collection
  class Global < Collection
    def org_templates?
      organization.template_collection_id == id
    end

    def profiles?
      organization.profile_collection_id == id
    end

    def getting_started?
      organization.getting_started_collection_id == id
    end

    def system_required?
      return true if profiles? || getting_started?
      # org templates collection is only required if it contains the profile_template
      # NOTE: could search all its children if they're required but seems like overkill?
      org_templates? && collection_ids.include?(organization.profile_template_id)
    end

    def reorder_cards!
      return super.reorder_cards! unless profiles?
      # profiles collection reorders alphabetically
      reorder_cards_by_collection_name!
    end
  end
end
