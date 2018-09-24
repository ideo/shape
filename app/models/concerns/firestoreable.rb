module Firestoreable
  extend ActiveSupport::Concern

  # similar to what's in base_controller except we sometimes use the simple serializers here
  JSONAPI_CLASS_MAPPINGS = {
    Activity: SerializableActivity,
    Notification: SerializableNotification,
    User: SerializableUser,
    Group: SerializableSimpleGroup,
    Collection: SerializableSimpleCollection,
    CommentThread: SerializableCommentThread,
    'Collection::Global': SerializableSimpleCollection,
    'Collection::TestCollection': SerializableSimpleCollection,
    'Collection::TestDesign': SerializableSimpleCollection,
    'Collection::SubmissionBox': SerializableSimpleCollection,
    'Collection::UserProfile': SerializableSimpleCollection,
    'Item::VideoItem': SerializableSimpleItem,
    'Item::TextItem': SerializableSimpleItem,
    'Item::FileItem': SerializableSimpleItem,
    'Item::LinkItem': SerializableSimpleItem,
    'Item::QuestionItem': SerializableSimpleItem,
    'CollectionCard::Primary': SerializableCollectionCard,
    'CollectionCard::Link': SerializableCollectionCard,
  }.freeze

  included do
    after_destroy :delete_from_firestore
  end

  def store_in_firestore
    # store this single record in a batch job
    FirestoreBatchWriter.perform_async([batch_job_identifier])
  end

  def delete_from_firestore
    # delete this single record in a batch job
    FirestoreBatchDeleter.perform_async([batch_job_identifier])
  end

  # gets passed a firestore batch object to use for the write
  def store_in_batch(batch)
    batch.set(firestore_doc_id, serialized_for_firestore)
  end

  def delete_in_batch(batch)
    batch.delete(firestore_doc_id)
  end

  def firestore_doc_id
    # e.g. "users_threads/id"
    "#{self.class.base_class.name.pluralize.underscore}/#{id}"
  end

  def batch_job_identifier
    # used by background job to lookup the record
    [self.class.base_class.name, id]
  end

  def serialized_for_firestore
    # this should always get overridden in model class
    {}
  end
end
