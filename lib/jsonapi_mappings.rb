# frozen_string_literal: true

# NOTE: is there a better way to capture default mappings than loading this directory... ?
require_dependency "#{Rails.root}/app/serializers/base_json_serializer"
Dir["#{Rails.root}/app/serializers/*.rb"].each { |file| require_dependency file }
DEFAULT_SERIALIZERS = BaseJsonSerializer.descendants.map(&:name).freeze

::JSONAPI_CUSTOM_MAPPINGS = {
  'ActsAsTaggableOn::Tag': SerializableTag,
  'Item::VideoItem': SerializableItem,
  'Item::TextItem': SerializableItem,
  'Item::FileItem': SerializableItem,
  'Item::ExternalImageItem': SerializableItem,
  'Item::LinkItem': SerializableItem,
  'Item::QuestionItem': SerializableItem,
  'Item::ChartItem': SerializableItem,
  'Item::DataItem': SerializableDataItem,
  'Item::LegendItem': SerializableLegendItem,
  'Collection::UserCollection': SerializableCollection,
  'Collection::ApplicationCollection': SerializableCollection,
  'Collection::Board': SerializableCollection,
  'Collection::SearchCollection': SerializableCollection,
  'Collection::SharedWithMeCollection': SerializableCollection,
  'Collection::Global': SerializableCollection,
  'Collection::TestCollection': SerializableCollection,
  'Collection::TestDesign': SerializableCollection,
  'Collection::TestResultsCollection': SerializableCollection,
  'Collection::TestOpenResponses': SerializableCollection,
  'Collection::SubmissionBox': SerializableCollection,
  'Collection::SubmissionsCollection': SerializableSubmissionsCollection,
  'Collection::UserProfile': SerializableCollection,
  'CollectionCard::Primary': SerializableCollectionCard,
  'CollectionCard::Link': SerializableCollectionCard,
  'CollectionCard::Placeholder': SerializableCollectionCard,
  'Dataset::CollectionsAndItems': SerializableDataset,
  'Dataset::Empty': SerializableDataset,
  'Dataset::External': SerializableDataset,
  'Dataset::NetworkAppMetric': SerializableDataset,
  'Dataset::Question': SerializableDataset,
  'Group::Global': SerializableGroup,
}.freeze

mappings = {}
DEFAULT_SERIALIZERS.each do |serializer|
  klass = serializer.gsub('Serializable', '')
  next if klass.include? 'Simple'

  mappings[klass.to_sym] = serializer.safe_constantize
end

::JSONAPI_ALL_MAPPINGS = ::JSONAPI_CUSTOM_MAPPINGS.merge(mappings).freeze
