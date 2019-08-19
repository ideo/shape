class FirestoreBatchWriter
  include Sidekiq::Worker

  def perform(objects)
    @objects = retrieve_objects(objects)
    save_objects_in_firestore
  end

  private

  # expects objects in the form of ["klass", "id"]
  def retrieve_objects(objects)
    objects.map do |klass, id|
      begin
        klass.classify.constantize.find(id)
      rescue ActiveRecord::RecordNotFound
        # record has already been deleted, no prob...
        logger.debug 'record already deleted.'
      end
    end
  end

  def save_objects_in_firestore
    @objects.each_slice(400) do |batch|
      batch.each do |object|
        FirestoreClient.client.batch do |firestore_batch|
          next unless object.is_a?(Firestoreable)
          object.store_in_batch(firestore_batch)
        end
      end
    end
  end
end
