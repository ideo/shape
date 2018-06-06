class SerializableNotification < BaseJsonSerializer
  type 'notifications'
  attributes :id, :read, :created_at, :activity_id, :user_id,
             :combined_actor_count, :combined_activities_ids
  belongs_to :activity
  belongs_to :user

  has_many :combined_actors do
    data do
      # frontend will combine "User A, B, C did X" with up to 3 people
      @object.combined_actors.limit(3)
    end
  end

  attribute :identifier do
    "#{@object.activity.organization_id}_#{@object.user_id}"
  end
end
