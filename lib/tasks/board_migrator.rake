namespace :board_migrator do
  desc 'migrate collections to 4WFC'
  task migrate: :environment do
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
end
