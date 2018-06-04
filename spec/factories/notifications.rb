FactoryBot.define do
  factory :notification do
    activity
    read false
    user
  end
end
