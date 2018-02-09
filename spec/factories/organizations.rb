FactoryBot.define do
  factory :organization do
    transient do
      admin nil
      member nil
      guest nil
    end

    name { Faker::Company.name }

    after(:create) do |org, evaluator|
      [:admin, :member, :guest].each do |role|
        next if evaluator.send(role).blank?
        evaluator.send(role).add_role(role, org)
      end
    end
  end
end
