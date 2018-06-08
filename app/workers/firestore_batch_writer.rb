class FirestoreBatchWriter
  include Sidekiq::Worker

  # action = 'save' or 'delete'
  def perform(objects, action = 'save')
    # expects objects in the form of "klass" => "id"
    @objects = retrieve_objects(objects)
    if action == 'save'
      store_objects_in_firestore
    elsif action == 'delete'
      delete_objects_in_firestore
    end
  end

  private

  def retrieve_objects(objects)
    objects.map do |klass, id|
      klass.classify.constantize.find(id)
    end
  end

  def store_objects_in_firestore
    FirestoreClient.client.batch do |batch|
      @objects.each do |object|
        next unless object.is_a?(Firestoreable)
        object.store_in_batch(batch)
      end
    end
  end

  def delete_objects_in_firestore
    FirestoreClient.client.batch do |batch|
      @objects.each do |object|
        next unless object.is_a?(Firestoreable)
        object.delete_in_batch(batch)
      end
    end
  end
end
