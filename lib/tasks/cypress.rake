namespace :cypress do
  desc 'set up the test env for cypress E2E testing'
  task db_setup: :environment do
    # clear out any orgs we created
    # NOTE: have to do this first, or else it gets mad if we do this after the user is loaded
    Organization.where('slug LIKE ?', 'our-test-org%').destroy_all
    Organization.where(name: 'CypressTest').destroy_all
    User.where('email LIKE ?', 'cypress-test%').destroy_all
    User.where('handle LIKE ?', 'cy-test-%').destroy_all

    email = 'cypress-test@ideo.com'
    user = FactoryBot.create(:user, email: email).becomes(User)
    builder = OrganizationBuilder.new(
      { name: 'CypressTest' }, user, full_setup: false
    )
    builder.save
    organization = builder.organization
    user.switch_to_organization(organization)
    # add an additional test user into the org
    FactoryBot.create(:user, email: 'cypress-test-1@ideo.com', add_to_org: organization)
    create_cards(user.current_user_collection, user)
    create_events(organization)
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

  def create_events(organization)
    15.times do |_i|
      user = FactoryBot.create(:user, handle: "cy-test-#{Faker::Internet.unique.slug}")
      FactoryBot.create(:activity,
                        # with cache_classes = false, it gets angry if you try to pass in the
                        # actual model and not id (ActiveRecord::AssociationTypeMismatch)
                        organization_id: organization.id,
                        actor_id: user.id,
                        action: :viewed,
                        target: Collection.last,
                        created_at: Date.today - rand(100))
    end
  end
end
