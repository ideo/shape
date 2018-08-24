FactoryBot.define do
  factory :collection do
    transient do
      num_cards 0
      record_type :text
      card_relation :primary
      pin_cards false
      add_editors []
      add_content_editors []
      add_viewers []
    end

    name { Faker::Company.buzzword }
    # don't automatically call the `create_groups` callback when building a fake org for this collection
    organization factory: :organization_without_groups

    factory :user_collection, class: Collection::UserCollection
    factory :shared_with_me_collection, class: Collection::SharedWithMeCollection
    factory :global_collection, class: Collection::Global
    factory :user_profile, class: Collection::UserProfile
    factory :submission_box, class: Collection::SubmissionBox
    factory :submissions_collection, class: Collection::SubmissionsCollection

    after(:build) do |collection, evaluator|
      if evaluator.num_cards > 0
        1.upto(evaluator.num_cards) do |i|
          w = 1
          h = 1
          w = 3 if rand(1..4) == 4
          h = 2 if rand(1..4) == 4
          card_type = :"collection_card_#{evaluator.record_type}"
          cc = build(
            card_type,
            parent: collection,
            order: (i - 1),
            width: w,
            height: h,
            pinned: evaluator.pin_cards,
          )
          # e.g. primary_collection_cards or link_collection_cards
          card_relation = "#{evaluator.card_relation}_collection_cards"
          collection.send(card_relation) << cc
        end
      end
    end

    after(:create) do |collection, evaluator|
      if evaluator.add_editors.present?
        evaluator.add_editors.each do |user|
          user.add_role(Role::EDITOR, collection)
        end
      end
      if evaluator.add_content_editors.present?
        evaluator.add_content_editors.each do |user|
          user.add_role(Role::CONTENT_EDITOR, collection)
        end
      end
      if evaluator.add_viewers.present?
        evaluator.add_viewers.each do |user|
          user.add_role(Role::VIEWER, collection)
        end
      end
    end
  end
end
