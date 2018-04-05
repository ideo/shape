class AddRolesToChildrenWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(user_ids, group_ids, object_id, object_class, parent_collection)
    users_to_add = User.where(id: user_ids).to_a
    groups_to_add = Group.where(id: group_ids).to_a
    object = object_class.safe_constantize.find(object_id)
    # no need to proceed unless this object has children
    users_to_add.each do |user|
      mover = CardMover.new(
        from_collection: parent_collection,
        to_collection: user.collection.where(type: 'sharedwithme'),
        card_ids: [object_id],
        placement: 'begining',
        card_action: 'link',
      )
    end

  end
end
