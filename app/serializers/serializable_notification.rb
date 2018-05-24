class SerializableNotification < BaseJsonSerializer
  type 'notifications'
  attributes :id, :read, :created_at
  belongs_to :activity
  belongs_to :user
end
