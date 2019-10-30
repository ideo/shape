# Adds an after_save callback for the Tagging class to add our custom
# `organization_id` to the Tag
class ActsAsTaggableOn::Tagging
  after_save do
    if taggable.respond_to?(:organization_id)
      organization_id = taggable.organization_id

      unless tag.organization_ids.include?(organization_id)
        tag.organization_ids << organization_id
        tag.save
      end
    end
  end
end
