namespace :board_migrator do
  desc 'migrate collections to 4WFC'
  task migrate_ids: :environment do
    unless ENV['IDS'].present?
      abort 'USAGE: rake board_migrator:migrate IDS=1,2,3'
    end

    ids = ENV['IDS'].split(',')
    Collection.where(id: ids).find_in_batches.each do |batch|
      batch.each do |collection|
        CollectionGrid::BoardMigrator.call(collection: collection)
      end
    end
  end

  task migrate_all: :environment do
    %w[
      GETTING_STARTED_TEMPLATE_ID
      ORG_MASTER_TEMPLATES_ID
      COMMON_RESOURCE_GROUP_ID
      CREATIVE_DIFFERENCE_ADMINISTRATION_COLLECTION_ID
    ].each do |env_id|
      special_collection = Collection.find_by_id(ENV[env_id])
      next unless special_collection.present?

      CollectionGrid::BoardMigrator.call(collection: special_collection)
    end

    Collection.order(updated_at: :desc).where(num_columns: nil).find_in_batches.each do |batch|
      batch.each do |collection|
        CollectionGrid::BoardMigrator.call(collection: collection)
      rescue StandardError
        puts "unable to migrate collection #{collection.id}"
      end
    end
  end
end
