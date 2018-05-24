class SerializableActivity < BaseJsonSerializer
  type 'activities'
  attributes :id, :action, :created_at
  belongs_to :actor
  has_many :subject_users
  has_many :subject_groups
  belongs_to :target
end
