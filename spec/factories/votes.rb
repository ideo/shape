FactoryBot.define do
  factory :vote do
    user
    votable { create(:collection_card) }
  end
end
