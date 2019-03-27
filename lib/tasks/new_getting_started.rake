namespace :new_getting_started do
  desc 'update existing orgs for new getting_started experience'
  task update_templates: :environment do
    Organization.find_in_batches(batch_size: 100) do |batch|
      batch.each { |org| update_templates(org) }
    end
  end

  desc 'update existing user collections for new getting_started experience'
  task update_collections: :environment do
    total = Collection::UserCollection.count
    Collection::UserCollection.find_each.each_with_index do |c, i|
      puts "update_collections, id:#{c.id}; #{i} of #{total}"
      gs = c.collections.where(name: 'Getting Started with Shape').where.not(cloned_from: nil).first
      next unless gs
      o = gs.organization
      cc = gs.parent_collection_card

      o.getting_started_collection.copy_all_cards_into!(
        c,
        synchronous: true,
        system_collection: true,
        placement: cc.try(:order) || 'beginning',
      )
      cc.archive!
    end

    CollectionCard::Primary
      .joins(:collection)
      .where('collections.type = ?', Collection::SharedWithMeCollection)
      .update_all(hidden: true, updated_at: Time.current)
  end
end

def find_or_create_org_getting_started_collection(org)
  return if org.getting_started_collection.present?
  original_getting_started_collection = Collection.find(ENV['GETTING_STARTED_TEMPLATE_ID'])
  return unless original_getting_started_collection.present?
  getting_started_collection = original_getting_started_collection.duplicate!(
    copy_parent_card: true,
    parent: org.template_collection,
    system_collection: true,
    synchronous: true,
  )
  return unless getting_started_collection.persisted?

  unless getting_started_collection.is_a?(Collection::Global)
    getting_started_collection.update_attributes(
      type: Collection::Global.to_s,
    )
    getting_started_collection = getting_started_collection.becomes(Collection::Global)
  end
  org.update_attributes!(getting_started_collection: getting_started_collection)
  getting_started_collection
end

def update_templates(org)
  master_templates = Collection.find ENV['ORG_MASTER_TEMPLATES_ID']
  return unless master_templates.present?
  puts "Updating templates for #{org.name}"
  if org.template_collection.present?
    puts "found template_collection #{org.template_collection.id}"
    # copy master templates -- will find or create
    master_templates.copy_all_cards_into!(org.template_collection)
    org.template_collection

    # Share Org Templates with organization
    org.template_collection.update(shared_with_organization: true)
    org.primary_group.add_role(Role::VIEWER, org.template_collection)
    LinkToSharedCollectionsWorker.perform_async(
      [org.primary_group.user_ids],
      [],
      [org.template_collection.id],
      [],
    )
  end

  # Replace getting_started_collection for org
  c = org.getting_started_collection
  if c.present? && c.name == 'Getting Started with Shape'
    org.update(getting_started_collection_id: nil)
    c.archive!
  end
  find_or_create_org_getting_started_collection(org)
end
