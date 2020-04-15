class LinkBroadcastWorker
  include Sidekiq::Worker

  def perform(record_id, record_class, user_id = nil)
    @record_class = record_class
    @record = record_class.safe_constantize.find(record_id)
    @user = User.find_by(id: user_id)

    broadcast_to_linked_records
  end

  private

  def broadcast_to_linked_collections
    linked_cards.each do |card|
      CollectionUpdateBroadcaster
        .new(collection, @user)
        .send(@action)
    end
  end

  def linked_cards
    # Collection
    #   .joins(:link_collection_cards)
    #   .where(CollectionCard.arel_table["#{@record_class}_id"].eq(@record.id))
    #   .distinct
    @record.send("cards_linked_to_this_#{@record_class.downcase}")
  end
end
