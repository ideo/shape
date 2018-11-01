namespace :cypress do
  desc 'set up the test env for cypress E2E testing'
  task db_setup: :environment do
    email = 'cypress-test@ideo.com'
    user = User.find_by(email: email)
    unless user.present?
      user = FactoryBot.create(:user, email: email, id: 4)
    end
    organization = Organization.find_by(name: 'CypressTest')
    unless organization.present?
      builder = OrganizationBuilder.new({ name: 'CypressTest' }, user)
      builder.save
      organization = builder.organization
    end
    user.switch_to_organization(organization)
    my_collection = user.current_user_collection
    # via dependent: :destroy this will also remove everything in the test area
    my_collection.collections.where(name: 'Cypress Test Area').destroy_all
    create_cards(my_collection, user)
  end

  def create_cards(collection, user)
    builder = CollectionCardBuilder.new(
      params: {
        order: collection.collection_cards.last.order + 1,
        collection_attributes: {
          name: 'Cypress Test Area',
        },
      },
      parent_collection: collection,
      user: user,
    )
    builder.create

    card = builder.collection_card
    builder = CollectionCardBuilder.new(
      params: {
        order: 0,
        collection_attributes: {
          name: 'Inner Collection',
        },
      },
      parent_collection: card.collection,
      user: user,
    )
    builder.create
  end
end
