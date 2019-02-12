class SerializableOrganization < BaseJsonSerializer
  include SerializedExternalId
  type 'organizations'
  attributes :name, :domain_whitelist, :slug, :active_users_count, :trial_users_count, :in_app_billing, :deactivated, :terms_text_item_id
  belongs_to :primary_group
  belongs_to :guest_group
  belongs_to :admin_group
  belongs_to :terms_text_item

  attribute :current_user_collection_id, if: -> { @index } do
    @current_user.current_user_collection(@object.id)&.id
  end

  attribute :is_within_trial_period do
    @object.within_trial_period?
  end

  attribute :price_per_user do
    Organization::PRICE_PER_USER
  end

  attribute :current_billing_period_start do
    Time.now.utc.beginning_of_month.to_s
  end

  attribute :current_billing_period_end do
    Time.now.utc.end_of_month.to_s
  end

  attribute :trial_ends_at do
    @object.trial_ends_at ? @object.trial_ends_at.to_date.to_s : nil
  end

  attribute :overdue do
    @object.overdue_at ? 1.week.ago > @object.overdue_at : false
  end

  attribute :inaccessible_at do
    @object.overdue_at ? (@object.overdue_at + 2.week).to_s(:mdy) : nil
  end
end
