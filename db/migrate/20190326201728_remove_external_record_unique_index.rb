class RemoveExternalRecordUniqueIndex < ActiveRecord::Migration[5.1]
  def up
    remove_index :external_records, name: 'index_uniq_external_id'
    add_index :external_records,
              %i[external_id application_id externalizable_type externalizable_id],
              name: 'index_external_records_common_fields'
  end

  def down
    remove_index :external_records, name: 'index_external_records_common_fields'

    add_index :external_records,
              %i[external_id application_id externalizable_type],
              unique: true,
              name: 'index_uniq_external_id'
  end
end
