class AddSubmissionBoxTemplateIdToCollections < ActiveRecord::Migration[5.1]
  def change
    add_column :collections, :submission_template_id, :integer
    add_column :collections, :submission_box_type, :integer

    add_index :collections, :submission_template_id
    add_index :collections, :template_id
  end
end
