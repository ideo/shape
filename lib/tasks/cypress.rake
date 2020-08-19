namespace :cypress do
  desc 'set up the test env for cypress E2E testing'
  task db_setup: :environment do
    unless Rails.env.test?
      puts 'you do not want to run this, except in test env.'
      return
    end

    DatabaseCleaner.clean_with(:truncation)
    Rails.application.load_seed

    email = 'cypress-test@ideo.com'
    user = FactoryBot.create(:user, email: email).becomes(User)
    user.add_role(Role::SHAPE_ADMIN)
    user.save
    create_shell_orgs
    assigner = OrganizationAssigner.new(
      { name: 'CypressTest' },
      user,
      full_setup: false,
    )
    assigner.call
    organization = assigner.organization
    user.switch_to_organization(organization)
    # add an additional test user into the org
    FactoryBot.create(:user, email: 'cypress-test-1@ideo.com')
    # add a test group into the org
    FactoryBot.create(:group, organization: organization, add_admins: [user])
    create_cards(user.current_user_collection, user)
    create_events(organization)
    create_test_collection(organization)
  end

  def create_shell_orgs
    3.times do
      OrganizationShellBuilder.new.save
    end
  end

  def create_cards(collection, user)
    builder = CollectionCardBuilder.new(
      params: {
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
    15.times do
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

  def create_test_collection(organization)
    test_collection = FactoryBot.create(
      :test_collection,
      :with_test_audience,
      :completed,
      test_status: :live,
      organization_id: organization.id,
    )
    audience = test_collection.test_audiences.last.audience
    update_audience_criteria(audience)
    test_collection.reload
  end

  def update_audience_criteria(audience)
    {
      age_list: %w[Young Old],
      country_list: 'United States of America',
      interest_list: %w[Athlete Pets],
    }.each do |key, value|
      audience.send("#{key}=", value)
    end
    audience.update(name: 'My Test Audience')
  end
end
