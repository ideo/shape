class ApplicationOrganization < ApplicationRecord
  belongs_to :organization, required: true
  belongs_to :application, required: true
  belongs_to :root_collection, class_name: 'Collection::Global'

  delegate :user, to: :application, prefix: true

  before_create :create_root_collection
  before_create :add_user_to_organization
  before_destroy :remove_user_from_organization

  private

  def add_user_to_organization
    organization.setup_user_membership_and_collections(
      application_user, synchronous: false
    )
  end

  def remove_user_from_organization
    organization.remove_user_membership(application_user)
  end

  def create_root_collection
    self.root_collection = Collection::Global.create(
      organization: organization,
    )
    if root_collection.persisted?
      application_user.add_role(
        Role::EDITOR, root_collection.becomes(Collection)
      )
    end
    root_collection
  end
end
