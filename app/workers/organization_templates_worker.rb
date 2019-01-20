class OrganizationTemplatesWorker
  include Sidekiq::Worker

  def perform(organization_id, original_getting_started_id, user_id)
    organization = Organization.find(organization_id)
    original_getting_started_collection = Collection.find(original_getting_started_id)
    user = User.find(user_id)

    create_org_getting_started_collection(
      organization,
      original_getting_started_collection,
    )
    create_user_getting_started_collection(organization, user)
  rescue ActiveRecord::RecordNotFound
    # org was already deleted, e.g. in a test
    false
  end

  private

  def create_org_getting_started_collection(
    organization,
    original_getting_started_collection
  )
    getting_started_collection = original_getting_started_collection.duplicate!(
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
    getting_started_collection = organization.find_or_create_user_getting_started_collection(user, synchronous: true)
    CollectionUpdateBroadcaster.call(getting_started_collection)
    CollectionUpdateBroadcaster.call(getting_started_collection.parent)
  end
end
