class OrganizationTemplatesWorker
  include Sidekiq::Worker

  def perform(organization_id, org_template_id, user_id)
    organization = Organization.find(organization_id)
    org_getting_started_template = Collection.find(org_template_id)
    user = User.find(user_id)

    create_org_getting_started_collection(
      organization,
      org_getting_started_template,
    )
    create_user_getting_started_collection(organization, user)
  end

  private

  def create_org_getting_started_collection(
    organization,
    org_getting_started_template
  )
    getting_started_collection = org_getting_started_template.duplicate!(
      copy_parent_card: true,
      parent: organization.template_collection,
      system_collection: true,
      synchronous: true,
    )
    return unless getting_started_collection.persisted?

    unless getting_started_collection.is_a?(Collection::Global)
      getting_started_collection.update_attributes(
        type: Collection::Global.to_s,
      )
      getting_started_collection = getting_started_collection.becomes(Collection::Global)
    end
    organization.admin_group.add_role(Role::EDITOR, getting_started_collection)
    organization.update_attributes!(getting_started_collection: getting_started_collection)
  end

  def create_user_getting_started_collection(organization, user)
    organization.find_or_create_user_getting_started_collection(user)
  end
end
