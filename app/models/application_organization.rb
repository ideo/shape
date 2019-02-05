class ApplicationOrganization < ApplicationRecord
  belongs_to :organization, required: true
  belongs_to :application, required: true
  belongs_to :root_collection, class_name: 'Collection::UserCollection'

  delegate :user, :name, to: :application, prefix: true

  before_validation :create_user_and_add_to_organization, on: :create
  before_destroy :remove_user_from_organization

  private

  def create_user_and_add_to_organization
    organization.setup_bot_user_membership(application_user)
    self.root_collection = application_user.current_user_collection
  end

  def remove_user_from_organization
    organization.remove_user_membership(application_user)
  end
end
