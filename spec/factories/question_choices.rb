FactoryBot.define do
  factory :question_choice do
    text { Faker::TvShows::BreakingBad.character }
  end
end
