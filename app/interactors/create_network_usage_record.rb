class CreateNetworkUsageRecord
  include Interactor
  require_in_context :organization, :billable_users_count
  delegate_to_context :organization

  def call
    return unless organization.billable?

    create_network_usage_record
  end

  def create_network_usage_record
    NetworkApi::UsageRecord.create(
      quantity: context.billable_users_count,
      timestamp: Time.current.end_of_day.to_i,
      external_organization_id: organization.id,
    )
  rescue JsonApiClient::Errors::ServerError
    context.fail!
  end
end
