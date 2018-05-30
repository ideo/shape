class SerializableNotification < BaseJsonSerializer
  type 'notifications'
  attributes :id, :read, :created_at, :combined_activities_ids
  belongs_to :activity
  belongs_to :user

  has_many :combined_activities do
    data do
      Activity.where(id: @object.combined_activities_ids)
              .limit(3)
              .order(created_at: :desc)
    end
  end
end
