FactoryBot.define do
  factory :user, aliases: %i[author] do
    transient do
      add_to_org nil
    end

    email { Faker::Internet.unique.email }
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    handle { Faker::Internet.unique.slug }
    uid { SecureRandom.hex(15) }
    provider 'ideo'
    network_data do
      {
        picture: 'https://a3-images.myspacecdn.com/images03/1/240e42b5d9ce48a78983961e7fcb3c39/600x600.jpg',
        picture_medium: 'https://img.com/medium',
        picture_large: 'https://img.com/large',
      }
    end
    terms_accepted true
    status User.statuses[:active]

    after(:build) do |user|
      user.password = Devise.friendly_token(40)
      user.password_confirmation = user.password
    end

    after(:create) do |user, evaluator|
      if evaluator.add_to_org.present?
        org = evaluator.add_to_org
        user.add_role(Role::MEMBER, org.primary_group)
        org.setup_user_membership_and_collections(user)
      end
    end

    trait :pending do
      status User.statuses[:pending]
      invitation_token { Devise.friendly_token(40) }
      provider nil
      uid nil
    end
  end
end
