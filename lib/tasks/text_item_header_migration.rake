namespace :text_item_headers do
  desc 'migrate H1/H2 to inline format'
  task migrate: :environment do
    start = ENV['BATCH_START'] || 1
    puts "BATCH_START id:#{start}"
    count = Item::TextItem.where('id >= ?', start).count
    batches = count / 1000
    Item::TextItem.find_in_batches(start: start).each_with_index do |batch, i|
      puts "migrating text item batch #{i} / #{batches}"
      batch.each do |item|
        TextItemHeaderMigrator.call(item)
      end
    end
  end
end
