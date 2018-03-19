FactoryBot.define do
  factory :group do
    transient do
      add_admins []
      add_members []
    end
    organization
    name { Faker::Team.name }
    # Sequence necessary to get unique handles
    sequence(:handle) do |n|
      "#{n}-#{Faker::Dessert.flavor.parameterize.gsub(/\w+/, '')}"
    end

    after(:create) do |group, evaluator|
      if evaluator.add_admins.present?
        evaluator.add_admins.each do |user|
          user.add_role(Role::ADMIN, group)
        end
      end

      if evaluator.add_members.present?
        evaluator.add_members.each do |user|
          user.add_role(Role::MEMBER, group)
        end
      end
    end
  end
end
