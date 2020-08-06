class CalculateOrganizationBillableUsers
  include Interactor
  require_in_context :organization
  delegate_to_context :organization

  def call
    context.billable_users_count = calculate_billable_users
  end

  def calculate_billable_users
    count = organization.active_users_count

    # adjust for trial period
    if organization.within_trial_period?
      count -= organization.trial_users_count
    end

    # if over the limit (and not enterprise) mark as billable
    if count > Organization::FREEMIUM_USER_LIMIT && organization.in_app_billing
      organization.update(billable: true)
    end

    # at this point if they have never been marked `billable`, return 0
    return 0 unless organization.billable?

    [count, 0].max
  end
end
