namespace :method_library do
  desc 'Create collection filters for search collections that are part of the C∆ method library'
  task create_filters_for_search_collections: :environment do
    # Find the official Method Library collection
    creative_difference_method_library = Collection.find(ENV['SHAPE_METHOD_LIBRARY_ID'])

    # Find all of the child collections of the official Method Library collection
    search_collections = creative_difference_method_library.collections
    p "#{search_collections.count} collections found in Method Library"

    # define the tags for qualities and subqualities
    tags = ["purpose", "clarity", "usefulness", "passion", "looking out", "market insightfulness", "customer insightfulness", "tech insightfulness", "experimentation", "low-fidelity prototyping", "high-fidelity prototyping", "user testing", "modeling", "collaboration", "team collaboration", "network informality", "diversity of perspective", "collaboration characteristics", "empowerment", "fairness", "opposability", "autonomy", "risk tolerance", "process clarity", "refinement", "visionary in implementation", "technical creativity", "detail orientation", "expert", "systematizing design process", "developing and nurturing talent", "design process", "experience design", "building and running labs", "developing creative problem solving capabilities", "building ventures", "research", "business models", "strategy", "marketing", "org design", "business design", "creative work", "challenge", "worksheet", "ritual", "process", "article", "case study"]

    # Create collection filters by tag for each collection
    tags_created = []
    search_collections.each do |search_collection|
      existing_tags = search_collection.collection_filters.pluck(:text)

      counter = 0
      tags.each do |tag|
        if existing_tags.include?(tag)
          p "Skipping tag #{tag}: collection filter already exists for '#{tag}' in collection #{search_collection.id}"
          next
        end
        p "Creating collection filter with tag #{tag} for collection #{search_collection.id}"
        tags_created << search_collection.collection_filters.create(filter_type: :tag, text: tag)
        counter += 1
        p "Added #{counter} tag collection filters to #{search_collection.id}"
      end

      p "Total tags/filters created: #{tags_created.count}"
    end
  end
end
