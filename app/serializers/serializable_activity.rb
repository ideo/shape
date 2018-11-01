class SerializableActivity < BaseJsonSerializer
  type 'activities'
  attributes :action, :created_at, :content, :actor_id, :target_type, :target_id
  attribute :source_name do
    if @object.source.present? && @object.source.respond_to?(:name)
      @object.source.try(:name)
    else
      ''
    end
  end
  belongs_to :actor
  has_many :subject_users
  has_many :subject_groups
  belongs_to :target
end
