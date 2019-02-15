class CreateExternalRecords < ActiveRecord::Migration[5.1]
  def change
    create_table :external_records do |t|
      t.string :external_id
      t.belongs_to :application
      t.references :externalizable, polymorphic: true, index: { name: 'index_on_externalizable' }

      t.timestamps
    end

    add_index :external_records, %i[external_id application_id externalizable_type], unique: true, name: 'index_uniq_external_id'
  end
end
