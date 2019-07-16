class NetworkCreateUsageRecordWorker
  include Sidekiq::Worker

  def perform(organization_id)
    organization = Organization.find(organization_id)
    context = RecordOrganizationUsage.call(
      organization: organization,
    )
    # raise an error so that sidekiq will retry (and our error reporting will be triggered)
    raise StandardError, "RecordOrganizationUsage failure; org: #{organization_id}" if context.failure?
  rescue ActiveRecord::RecordNotFound
    false
  end
end
