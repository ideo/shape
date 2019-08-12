class CreateGlobalTranslations < ActiveRecord::Migration[5.2]
  def up
    Migrations::GlobalTranslationMigration.up
  end

  def down
    Migrations::GlobalTranslationMigration.down
  end
end
