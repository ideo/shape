# NOTE: since this generates local tmp files, it makes sense to dump prod -> local and then run this locally
require 'fileutils'
namespace :ideo_csv do
  desc 'generate IDEO CSVs'
  task generate: :environment do
    dir_name = 'ideo'
    FileUtils.mkdir_p Rails.root.join('tmp', dir_name)

    q = Collection
        .active
        .where(organization_id: 1)
        .merge(Collection.where.not(type: 'Collection::SharedWithMeCollection').or(Collection.not_custom_type))
        .includes(:created_by, :collection_cards)

    q.find_in_batches.each_with_index do |batch, i|
      puts "Generating batch #{i}"
      batch.each do |collection|
        csv = CollectionCSVBuilder.call(collection)
        filename = "#{collection.id}-#{collection.name.truncate(70, omission: '').parameterize}-#{Date.today}.csv"
        puts ">> Writing #{filename}..."
        File.open(Rails.root.join('tmp', dir_name, filename), 'w') do |file|
          file.write(csv)
        end
      end
    end
  end
end
