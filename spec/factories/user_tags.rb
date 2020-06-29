FactoryBot.define do
  factory :user_tag do
    user
    record { create(:collection) }
  end
end
