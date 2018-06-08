module Firestoreable
  extend ActiveSupport::Concern

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

  def object_identifier
    # used by background job to lookup the record
  end

  def serialized_for_firestore
    # this should always get overridden in model class
    {}
  end
end
