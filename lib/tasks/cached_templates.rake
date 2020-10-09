namespace :template do
  desc 'Caches org most used templates'
  task cache_organization_most_used_templates: :environment do
    Organization.find_in_batches.each do |batch|
      batch.cache_most_used_template_ids!
    end
  end
end
