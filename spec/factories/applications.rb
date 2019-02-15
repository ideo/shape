FactoryBot.define do
  factory :application do
    transient do
      add_orgs []
    end
    name { Faker::Company.buzzword }

    after(:create) do |application, evaluator|
      if evaluator.add_orgs.present?
        evaluator.add_orgs.each do |org|
          create(:application_organization, application: application, organization: org)
        end
      end
    end
  end
end
