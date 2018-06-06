class Comment < ApplicationRecord
  paginates_per 50
  belongs_to :comment_thread, touch: true
  belongs_to :author, class_name: 'User'

  validates :message, presence: true

  after_create :store_in_firestore

  def mentions
    return unless draftjs_data.present?
    mentions = {
      users: [],
      groups: [],
    }
    draftjs_data['entityMap'].each_pair do |_k, v|
      entity = Hashie::Mash.new(v)
      next unless entity.type == 'mention'
      id, type = entity.data.mention.id.split('__')
      mentions[type.to_sym] << id.to_i
    end
    {
      user_ids: mentions[:users].uniq,
      group_ids: mentions[:groups].uniq,
    }
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

  def store_in_firestore
    # TODO: background job
    FirestoreClient.client.batch do |batch|
      batch.set("comments/#{id}", serialized_for_firestore)
      # store comment_thread to update its `updated_at`
      batch.set("comment_threads/#{comment_thread.id}", comment_thread.serialized_for_firestore)
      # ping all the users threads so they get an updated unread_count
      comment_thread.users_threads.each do |ut|
        batch.set("users_threads/#{ut.id}", ut.serialized_for_firestore)
      end
    end
  end
end
