class SerializableOrganization < BaseJsonSerializer
  type 'organizations'
  attributes :name, :domain_whitelist, :slug, :active_users_count, :trial_users_count
  belongs_to :primary_group
  belongs_to :guest_group
  belongs_to :admin_group

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
    @object.trial_ends_at.to_date.to_s
  end
end
