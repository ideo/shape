class SerializableUser < BaseJsonSerializer
  type 'users'
  attributes :first_name, :last_name, :email,
             :created_at, :status,
             :handle, :shape_circle_member

  attribute :pic_url_square do
    @object.picture || 'https://s3-us-west-2.amazonaws.com/assets.shape.space/user-avatar.png'
  end

  belongs_to :current_organization
  has_many :organizations do
    data do
      @object.organizations.active
    end
  end
  has_many :groups do
    data { @object.current_org_groups_and_special_groups }
  end

  attribute :user_profile_collection_id do
    if @current_user.blank?
      nil
    else
      hash = @object.cached_user_profiles || {}
      hash[@current_user.current_organization_id.to_s].to_s
    end
  end

  attribute :feedback_contact_preference, if: -> { @survey_response } do
    @object.feedback_contact_preference
  end

  attribute :newly_created, if: -> { @survey_response } do
    @created
  end

  attribute :most_used_templates do
    @object.cached_last_5_used_templates
  end
end
