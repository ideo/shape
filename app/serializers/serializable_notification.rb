class SerializableNotification < BaseJsonSerializer
  type 'notifications'
  attributes :id, :read, :created_at
  belongs_to :activity
  belongs_to :user

  has_many :combined_activites do
    data do
      Activity.where(id: @object.combined_activities_ids)
              .limit(3)
              .order(order: :asc)
    end
  end
end
