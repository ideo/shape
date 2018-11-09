namespace :billing do
  desc 'migrate existing organization to billing'
  task migrate: :environment do
    plan = NetworkApi::Plan.first
    throw 'Must have an existing subscription plan!' unless plan

    enterprise_client_ids = [
      85,  # kyu collective
      87,  # Beacon Programs
      137, # Moon
      154, # Alicorp
      159, # Early Childhood Innovation Network
      243, # Ford
    ]

    puts 'BEGIN Ensuring network organizations'
    Organization.find_each do |organization|
      puts "  Ensuring network organization for #{organization.name}"
      network_organization = organization.find_or_create_on_network

      admin_role = NetworkApi::Role.find(name: 'admin', resource_id: network_organization.id, resource_type: 'Organization').first ||
                   NetworkApi::Role.create(name: 'admin', resource_id: network_organization.id, resource_type: 'Organization')

      organization.admins[:users].active.each do |admin|
        puts "    Adding #{organization.name} admin role to #{admin.email}"
        NetworkApi::UsersRole.create_by_uid(user_uid: admin.uid, role_id: admin_role.id)
      end
    end
    puts "END Ensuring network organizations\n\n"

    puts 'BEGIN Disabling in app billing for enterprise clients'
    Organization.where(id: enterprise_client_ids).find_each do |organization|
      organization.update_column(:in_app_billing, false)
      puts "  In app billing turned off for #{organization.name}"
    end
    puts "END Disabling in app billing for enterprise clients\n\n"

    puts 'BEGIN Creating subscriptions'
    Organization.where.not(id: enterprise_client_ids).find_each do |organization|
      NetworkApi::Subscription.create(
        organization_id: organization.network_organization.id,
        plan_id: plan.id,
      )
      puts "  Subscription created for #{organization.name}"
    end
    puts "END Creating subscriptions\n\n"

    puts 'BEGIN setting trial ending date'
    Organization.where.not(id: enterprise_client_ids).find_each do |organization|
      days_left_in_trial = (Organization::DEFAULT_TRIAL_ENDS_AT - (Time.current - organization.created_at)) / 1.day
      days_left_in_trial = 0 if days_left_in_trial.negative?
      organization.update_attributes!(trial_ends_at: days_left_in_trial.round.days.from_now)
      puts "  Set trial ends at for #{organization.name} to #{days_left_in_trial.round} days from now"
    end
    puts "END setting trial ending date\n\n"
  end
end
p
