class SerializableTestAudience < BaseJsonSerializer
  type 'test_audiences'
  attributes :sample_size, :audience_id, :test_collection_id

  belongs_to :audience
  belongs_to :test_collection
end
