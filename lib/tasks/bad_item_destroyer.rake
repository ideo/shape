namespace :bad_items do
  desc 'migrate H1/H2 to inline format'
  task destroy: :environment do
    start = ENV['BATCH_START'] || 1
    puts "BATCH_START id:#{start}"
    items = Item.where('jsonb_array_length(breadcrumb) > 40')
    if start > 1
      count = items.where('id >= ?', start).count
    else
      count = items.count
    end
    batches = count / 2500
    items.find_in_batches(batch_size: 2500, start: start).each_with_index do |batch, i|
      puts "deleting bad item batch #{i} / #{batches} -- breadcrumb length: #{batch.first&.breadcrumb&.count}"
      batch.each(&:destroy)
    end
  end
end
