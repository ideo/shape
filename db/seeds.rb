# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

num_collections = 10
num_cards_per_collection = 30
num_sub_collections = 2

organization = FactoryBot.create(:organization)

1.upto(num_collections) do
  # Create collection, with cards of text items
  collection = FactoryBot.create(:collection,
                                 organization: organization,
                                 num_cards: num_cards_per_collection)

  # Create sub-collections
  1.upto(num_sub_collections) do |i|
    order = num_cards_per_collection + i + 1

    # Create card to store the sub-collection
    card = FactoryBot.create(:collection_card_collection,
                             parent: collection,
                             order: order)

    # Create the sub-collection
    FactoryBot.create(:collection,
                      :subcollection,
                      num_cards: num_cards_per_collection,
                      parent_collection_card: card)
  end
end
