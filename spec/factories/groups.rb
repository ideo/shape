FactoryBot.define do
  factory :group do
    transient do
      add_admins []
      add_members []
      add_subgroups nil
    end
    organization factory: :organization_without_groups
    name { Faker::Team.name }
    handle { Faker::Internet.unique.slug }
    network_id { SecureRandom.hex }
    created_by factory: :user

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

      if evaluator.add_subgroups.present?
        evaluator.add_subgroups.each do |subgroup|
          create(
            :group_hierarchy,
            parent_group: group,
            subgroup: subgroup,
          )
        end
      end
    end

    factory :global_group, class: Group::Global do
      trait :common_resource do
        id { Shape::COMMON_RESOURCE_GROUP_ID }
      end
    end
  end
end
