# frozen_string_literal: true

# https://stackoverflow.com/a/18979544
$VERBOSE = nil

# NOTE: is there a better way to capture default mappings than loading this directory... ?
require_dependency "#{Rails.root}/app/serializers/base_json_serializer"
Dir["#{Rails.root}/app/serializers/*.rb"].each { |file| require_dependency file }

class JsonapiMappings
  DEFAULT_SERIALIZERS = BaseJsonSerializer.descendants.map(&:name).freeze

  CUSTOM_MAPPINGS = {
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

  ALL_MAPPINGS = CUSTOM_MAPPINGS.merge(mappings).freeze
end
