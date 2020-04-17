class LinkBroadcastWorker
  include Sidekiq::Worker

  def perform(record_id, record_class, user_id = nil)
    @record_class = record_class
    @record = record_class.safe_constantize.find(record_id)
    @user = User.find_by(id: user_id)

    broadcast_to_linked_records
  end

  private

  def broadcast_to_linked_records
    linked_cards.find_each do |card|
      next if card.parent.num_viewers.zero?

      CollectionUpdateBroadcaster
        .new(card.parent, @user)
        .card_updated(card)
    end
  end

  def linked_cards
    @record.send("cards_linked_to_this_#{@record_class.downcase}")
  end
end
