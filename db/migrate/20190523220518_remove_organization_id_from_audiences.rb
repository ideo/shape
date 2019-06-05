class RemoveOrganizationIdFromAudiences < ActiveRecord::Migration[5.1]
  def change
    remove_reference :audiences, :organization
  end
end
