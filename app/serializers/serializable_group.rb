class SerializableGroup < BaseJsonSerializer
  include SerializedExternalId
  type 'groups'
  attributes :name, :handle, :organization_id, :icon_url
  has_many :roles

  attribute :is_primary do
    @object.primary?
  end

  attribute :is_guest do
    @object.guest?
  end

  attribute :is_admin do
    @object.admin?
  end

  attribute :filestack_file_url do
    @object.avatar_url
  end

  attribute :can_edit do
    # we do not use the ability here because this should work before
    # the terms have been accepted, to have conditional messaging on
    # the front end
    @object.can_edit? @current_user
  end

  attribute :business_unit, if: -> { @object.business_unit.present? } do
    @object.business_unit
  end
end
