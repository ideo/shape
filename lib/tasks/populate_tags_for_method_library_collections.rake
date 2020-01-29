namespace :method_library_collections do
  desc 'Populate the method collections in the All Methods Collection with tags'
  task populate_tags: :environment do
      all_methods_collection_id = ENV['SHAPE_ALL_METHODS_COLLECTION_ID']
      raise 'Need to set All Methods Collection ID in .env' unless all_methods_collection_id

      file_path = '/Users/mvillwock/Downloads/method_library_content_all_methods.csv'
      hash = {}
      p "READING CSV"
      CSV.read(file_path, headers: true).each do |row|
        name = row.field("Method Name")
        tags = row.field("Eng- Add tags to shape :-)")
        hash[name] = tags || []
        hash
      end
      p hash

      p "Finding method collections"
      method_collections = CollectionCard.where(
        parent_id: all_methods_collection_id
      ).map(&:record).select do |collection|
        hash.keys.include?(collection.name)
      end
      p "number of method collections: #{method_collections.count}"

      # update the tags for each method
      initial = method_collections.map(&:tag_list).flatten.count
      p "initial number of tags: #{initial}"
      p "updating tag lists for each method"
      total = 0
      method_collections.each do |collection|
        total += collection.tag_list.count
        collection.tag_list += hash[collection.name]
        collection.save
      end
      p "ending number of tags: #{total}"
  end
end
