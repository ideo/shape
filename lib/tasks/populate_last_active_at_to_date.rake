namespace :last_active_at do
  desc 'Populate users with new last_active_at format (now with multiple orgs!)'
  task populate: :environment do
      User.active.includes(:organizations).find_each(batch_size: 350) do |user|
        org_to_timestamps = {}
        p "Updating organization timestamps for user"
        user.organizations.each do |org|
          timestamp = Activity.where(organization_id: org.id, actor_id: user.id).last&.created_at
          next if timestamp.nil?

          org_to_timestamps[org.id] = timestamp
        end
        p "User has these timestamps for these orgs"
        p org_to_timestamps
        user.update_columns(last_active_at: org_to_timestamps)
      end
  end
end
