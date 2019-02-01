class ApplicationOrganization < ApplicationRecord
  belongs_to :organization, required: true
  belongs_to :application, required: true
  belongs_to :root_collection, class_name: 'Collection::Global'

  before_create :create_root_collection

  private

  def create_root_collection
    self.root_collection = Collection::Global.create(
      organization: organization,
    )
  end
end
