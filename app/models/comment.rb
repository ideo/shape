class Comment < ApplicationRecord
  include Firestoreable

  paginates_per 50
  belongs_to :comment_thread, touch: true
  belongs_to :author, class_name: 'User'

  validates :message, presence: true

  def mentions
    mentions = {
      users: [],
      groups: [],
    }
    entity_map = draftjs_data.try(:[], 'entityMap') || {}
    entity_map.each_pair do |_k, v|
      entity = Hashie::Mash.new(v)
      next unless entity.type == 'mention'
      id, type = entity.data.mention.id.split('__')
      mentions[type.to_sym] << id.to_i
    end
    Hashie::Mash.new(
      user_ids: mentions[:users].uniq,
      group_ids: mentions[:groups].uniq,
    )
  end

  def serialized_for_firestore
    renderer = JSONAPI::Serializable::Renderer.new
    renderer.render(
      self,
      class: { Comment: SerializableComment, User: SerializableUser },
      include: %i[author],
      fields: { users: User.basic_api_fields },
    )
  end

  # override Firestoreable method to include related records
  def store_in_batch(batch)
    # store the comment
    batch.set(firestore_doc_id, serialized_for_firestore)
    # store comment_thread to update its `updated_at`
    comment_thread.store_in_batch(batch)
    # ping all the users threads so they get an updated unread_count
    comment_thread.users_threads.each do |ut|
      ut.store_in_batch(batch)
    end
  end
end
