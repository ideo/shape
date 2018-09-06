class SerializableActivity < BaseJsonSerializer
  type 'activities'
  attributes :action, :created_at, :content, :actor_id, :target_type, :target_id
  belongs_to :actor
  has_many :subject_users
  has_many :subject_groups
  belongs_to :target
end
