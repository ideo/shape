namespace :front_end_factories do
  desc 'Create json objects for things in use on the front end'

  task create: :environment do
    renderer = JSONAPI::Serializable::Renderer.new
    object_classes = %w[
      Collection
      Item
      CollectionCard
      Dataset
      QuestionChoice
      User
      Group
      Organization
    ]
    object_classes.each do |object_class|
      factory_class_name = object_class.tableize.singularize
      factory_class_name = 'text_item' if factory_class_name == 'item'
      pp "Creating front end factory for #{factory_class_name}"
      default_user = User.find 22
      ability = Ability.new(default_user)
      object = FactoryBot.create(factory_class_name)
      json = renderer.render(object,
                             class: jsonapi_class,
                             expose: {
                               current_user: default_user,
                               current_ability: ability,
                               frontend_url_for: lambda { |_obj| 'http://localhost/' }
                             }).as_json
      # write json file?
      File.open("__js_test_config/factories/#{object_class}.json", 'w') do |f|
        f.write(json)
      end
    end
  end

  def jsonapi_class
    # TODO: share this with base controller
    {
      'Item': SerializableItem,
      'Item::VideoItem': SerializableItem,
      'Item::TextItem': SerializableItem,
      'Item::FileItem': SerializableItem,
      'Item::ExternalImageItem': SerializableItem,
      'Item::LinkItem': SerializableItem,
      'Item::QuestionItem': SerializableItem,
      'Item::ChartItem': SerializableItem,
      'Item::DataItem': SerializableDataItem,
      'Item::LegendItem': SerializableLegendItem,
      'Collection': SerializableCollection,
      'Collection::UserCollection': SerializableCollection,
      'Collection::ApplicationCollection': SerializableCollection,
      'Collection::Board': SerializableCollection,
      'Collection::SharedWithMeCollection': SerializableCollection,
      'Collection::Global': SerializableCollection,
      'Collection::TestCollection': SerializableCollection,
      'Collection::TestDesign': SerializableCollection,
      'Collection::TestResultsCollection': SerializableCollection,
      'Collection::TestOpenResponses': SerializableCollection,
      'Collection::SubmissionBox': SerializableCollection,
      'Collection::SubmissionsCollection': SerializableSubmissionsCollection,
      'Collection::UserProfile': SerializableCollection,
      'CollectionCard': SerializableCollectionCard,
      'CollectionCard::Primary': SerializableCollectionCard,
      'CollectionCard::Link': SerializableCollectionCard,
      'Dataset': SerializableDataset,
      'Dataset::CollectionsAndItems': SerializableDataset,
      'Dataset::CollectionsAndItems': SerializableDataset,
      'Dataset::Empty': SerializableDataset,
      'Dataset::External': SerializableDataset,
      'Dataset::NetworkAppMetric': SerializableDataset,
      'Dataset::Question': SerializableDataset,
      'User': SerializableUser,
      'Organization': SerializableOrganization,
      'QuestionChoice': SerializableQuestionChoice,
      'QuestionAnswer': SerializableQuestionAnswer,
      'Group': SerializableGroup,
      'Group::Global': SerializableGroup
    }
  end
end
