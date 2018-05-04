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
        next if evaluator.send(role).blank?
        evaluator.send(role).add_role(role, org.primary_group)
      end
      if evaluator.guest.present?
        evaluator.guest.add_role(Role::MEMBER, org.guest_group)
      end
    end
  end
end
