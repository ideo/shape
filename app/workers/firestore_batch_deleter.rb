class FirestoreBatchDeleter
  include Sidekiq::Worker

  def perform(objects)
    delete_objects_from_firestore(objects)
  end

  private

  def delete_objects_from_firestore(objects)
    FirestoreClient.client.batch do |batch|
      objects.each do |klass, id|
        # object is deleted from the DB so we just reconstruct the identifier
        identifier = "#{klass.pluralize.underscore}/#{id}"
        batch.delete(identifier)
      end
    end
  end
end
