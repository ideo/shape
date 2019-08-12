class CreateGlobalTranslations < ActiveRecord::Migration[5.2]
  def up
    GlobalTranslationMigration.up
  end

  def down
    GlobalTranslationMigration.down
  end
end
