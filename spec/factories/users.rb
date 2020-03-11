FactoryBot.define do
  factory :user, aliases: %i[author] do
    transient do
      add_to_org nil
    end

    email { Faker::Internet.unique.email }
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    handle { Faker::Internet.unique.slug }
    locale { 'en' }
    uid { SecureRandom.hex(15) }
    phone { '415-555-5555' }
    provider 'ideo'
    network_data do
      {
        picture: 'https://a3-images.myspacecdn.com/images03/1/240e42b5d9ce48a78983961e7fcb3c39/600x600.jpg',
        picture_medium: 'https://img.com/medium',
        picture_large: 'https://img.com/large',
      }
    end
    terms_accepted true
    feedback_terms_accepted true
    use_template_setting 1
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
      provider nil
      uid nil
    end

    trait :super_admin do
      after(:create) do |user|
        user.add_role(:super_admin)
        user.reset_cached_roles!
      end
    end

    trait :recently_active do
      after(:create) do |user|
        create(:activity, organization: user.current_organization, actor: user)
      end
    end

    trait :application_bot do
      application
    end
  end
end
