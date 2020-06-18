# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

org = Organization.find_or_initialize_by(id: 1)
if org.new_record?
  org = FactoryBot.create(:organization_without_groups)
end
if ENV['GETTING_STARTED_TEMPLATE_ID']
  c = Collection.find_or_initialize_by(
    id: ENV['GETTING_STARTED_TEMPLATE_ID'],
  )
  if c.new_record?
    c.name = 'Seeded Content for My Collection'
    c.organization = org
    c.save

    # just to give it one item
    FactoryBot.create(:collection_card_text, parent: c)
  end
end

if ENV['ORG_MASTER_TEMPLATES_ID']
  c = Collection.find_or_initialize_by(
    id: ENV['ORG_MASTER_TEMPLATES_ID'],
  )
  if c.new_record?
    c.name = 'Master Templates'
    c.organization = org
    c.save

    # just to give it one template
    FactoryBot.create(:collection, master_template: true, num_cards: 1, parent_collection: c)
  end
end

# Add universally available audiences
if Audience.count.zero?
  Audience.create(name: 'Share via Link', global_default: 1, min_price_per_response: 0)
  Audience.create(name: 'All People (No Filters)', global_default: 2, min_price_per_response: 3.75)
  %w[Admins Reviewers Participants].each do |audience_name|
    Audience.create(name: audience_name, audience_type: :challenge)
  end
end
