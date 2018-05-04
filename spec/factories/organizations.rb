FactoryBot.define do
  factory :organization do
    transient do
      admin nil
      member nil
      guest nil
    end

    name { Faker::Company.name }

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
