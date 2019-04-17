class ApplicationOrganization < ApplicationRecord
  belongs_to :organization, required: true
  belongs_to :application, required: true
  belongs_to :root_collection, class_name: 'Collection::ApplicationCollection'

  delegate :user, :name, to: :application, prefix: true

  before_validation :create_root_collection, on: :create
  before_create :add_bot_user_to_organization
  before_destroy :remove_user_from_organization

  private

  def create_root_collection
    return if application.blank? || organization.blank?

    self.root_collection = Collection::ApplicationCollection
                           .find_or_create_for_bot_user(application_user, organization)
  end

  def add_bot_user_to_organization
    organization.setup_bot_user_membership(application_user)
  end

  def remove_user_from_organization
    organization.remove_user_membership(application_user)
  end
end
