class RecordOrganizationUsage
  include Interactor::Organizer
  include Interactor::Schema

  schema :organization,
         :active_users_initial_count

  organize CalculateOrganizationActiveUsers
end
