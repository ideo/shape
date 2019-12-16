namespace :front_end_factories do
  desc 'Create json objects for things in use on the front end'

  task create: :environment do
    object_classes = %w[
      collection
      text_item
      file_item
      collection_card
      collection_filter
      dataset
      question_choice
      user
      group
      organization
      notification
      activity
      audience
    ]
    object_classes.each do |object_class|
      pp "Creating front end factory for #{object_class}"
      object = FactoryBot.create(object_class)
      render_object_to_file(object, name: object_class)
    end
  end

  def render_object_to_file(object, name: nil)
    file_name = object.class.name.tableize.singularize
    file_name = name if name.present?
    default_user = User.find 22
    ability = Ability.new(default_user)
    json = renderer.render(object,
                           class: jsonapi_class,
                           expose: {
                             current_user: default_user,
                             current_ability: ability,
                             frontend_url_for: lambda { |_obj| 'http://localhost/' }
                           }).to_json

    File.open("__js_test_config/factory/data/#{file_name}.json", 'w') do |f|
      f.write(json)
    end\
  end

  def renderer
    @renderer ||= JSONAPI::Serializable::Renderer.new
  end

  def jsonapi_class
    # TODO: share this with base controller
    {
      'Activity': SerializableActivity,
      'Audience': SerializableAudience,
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
      'CollectionFilter': SerializableCollectionFilter,
      'Dataset': SerializableDataset,
      'Dataset::CollectionsAndItems': SerializableDataset,
      'Dataset::CollectionsAndItems': SerializableDataset,
      'Dataset::Empty': SerializableDataset,
      'Dataset::External': SerializableDataset,
      'Dataset::NetworkAppMetric': SerializableDataset,
      'Dataset::Question': SerializableDataset,
      'Notification': SerializableNotification,
      'Organization': SerializableOrganization,
      'QuestionChoice': SerializableQuestionChoice,
      'QuestionAnswer': SerializableQuestionAnswer,
      'User': SerializableUser,
      'Group': SerializableGroup,
      'Group::Global': SerializableGroup
    }
  end
end
