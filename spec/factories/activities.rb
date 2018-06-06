FactoryBot.define do
  factory :activity do
    organization
    actor factory: :user
    target factory: :collection
  end
end
