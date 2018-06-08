class FirestoreBatchWriter
  include Sidekiq::Worker

  def perform(objects)
    puts '***** -> FirestoreBatchWriter'
    puts objects.inspect
    puts '*****'
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
    FirestoreClient.client.batch do |batch|
      @objects.each do |object|
        next unless object.is_a?(Firestoreable)
        object.store_in_batch(batch)
      end
    end
  end
end
