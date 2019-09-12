FactoryBot.define do
  factory :group_hierarchy do
    association :subgroup
    association :parent_group
    association :granted_by
  end
end
