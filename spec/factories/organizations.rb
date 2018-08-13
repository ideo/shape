FactoryBot.define do
  factory :organization do
    transient do
      admin nil
      member nil
      guest nil
    end

    name { Faker::Company.name }

    # by default org has a `create_groups` callback with a lot of overhead.
    # this allows a simpler version of create(:organization)
    factory :organization_without_groups do
      before(:create) do |org|
        # idea from https://stackoverflow.com/a/35562805/260495
        org.define_singleton_method(:create_groups) {}
      end
    end

    after(:create) do |org, evaluator|
      [Role::ADMIN, Role::MEMBER].each do |role|
        user = evaluator.send(role)
        next if user.blank?
        user.add_role(role, org.primary_group)
        org.setup_user_membership_and_collections(user)
      end
      if evaluator.guest.present?
        user = evaluator.guest
        user.add_role(Role::MEMBER, org.guest_group)
        org.setup_user_membership_and_collections(user)
      end
    end
  end
end
