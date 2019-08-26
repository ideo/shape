class RecordOrganizationUsage
  include Interactor::Organizer
  include Interactor::Schema

  schema :organization,
         # these get added by underlying services
         :active_users_initial_count,
         :billable_users_count

  organize(
    CalculateOrganizationActiveUsers,
    CalculateOrganizationBillableUsers,
    CreateNetworkUsageRecord,
    NotifyBillingChanges,
  )
end
