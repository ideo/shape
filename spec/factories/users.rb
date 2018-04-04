FactoryBot.define do
  factory :user do
    transient do
      add_to_org nil
    end

    email { Faker::Internet.unique.email }
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    uid SecureRandom.hex(15)
    provider 'okta'
    pic_url_square 'https://a3-images.myspacecdn.com/images03/1/240e42b5d9ce48a78983961e7fcb3c39/600x600.jpg'

    after(:build) do |user|
      user.password = Devise.friendly_token(40)
      user.password_confirmation = user.password
    end

    after(:create) do |user, evaluator|
      if evaluator.add_to_org.present?
        user.add_role(Role::MEMBER, evaluator.add_to_org.primary_group)
      end
    end

    trait :pending do
      status :pending
      invitation_token { Devise.friendly_token(40) }
      provider nil
      uid nil
    end
  end
end
