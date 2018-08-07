FactoryBot.define do
  factory :activity do
    organization factory: :organization_without_groups
    actor factory: :user
    target factory: :collection
  end
end
