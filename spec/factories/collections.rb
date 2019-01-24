FactoryBot.define do
  factory :collection do
    transient do
      num_cards 0
      parent_collection nil
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
    factory :getting_started_template_collection, class: Collection::Global do
      after(:create) do |collection|
        collection.organization.update_attributes(
          getting_started_collection: collection,
        )
      end
    end
    factory :user_profile, class: Collection::UserProfile
    factory :submission_box, class: Collection::SubmissionBox
    factory :submissions_collection, class: Collection::SubmissionsCollection

    trait :submission do
      after(:create) do |collection|
        # needed for `inside_a_submission?` check
        collection.update(submission_attrs: { submission: true })
      end
    end

    factory :test_design, class: Collection::TestDesign do
      transient do
        record_type :question
      end
    end
    factory :test_collection, class: Collection::TestCollection do
      transient do
        record_type :question
      end

      trait :answerable_questions do
        after(:create) do |collection|
          collection.prelaunch_question_items.each do |item|
            item.update(question_type: :question_context)
          end
        end
      end

      trait :open_response_questions do
        after(:create) do |collection|
          collection.prelaunch_question_items.each do |item|
            item.update(question_type: :question_open)
          end
        end
      end

      trait :with_responses do
        after(:create) do |collection|
          survey_responses = create_list(:survey_response, 5, test_collection: collection)
          survey_responses.map do |response|
            question = response.question_items.select(&:question_useful?).first
            create(:question_answer,
                   survey_response: response,
                   question: question)
            response.update_attribute(:status, :completed)
            collection.reload
          end
        end
      end

      trait :completed do
        after(:create) do |collection|
          media_question = collection.prelaunch_question_items.detect(&:question_media?)
          media_question&.update(type: 'Item::VideoItem', url: 'something', thumbnail_url: 'something', question_type: nil)
          description_question = collection.prelaunch_question_items.detect(&:question_description?)
          description_question&.update(content: 'something')
        end
      end
    end
    factory :test_open_responses_collection, class: Collection::TestOpenResponses

    after(:build) do |collection, evaluator|
      if evaluator.num_cards > 0
        1.upto(evaluator.num_cards) do |i|
          card_type = :"collection_card_#{evaluator.record_type}"
          cc = build(
            card_type,
            parent: collection,
            order: (i - 1),
            width: 1,
            height: 1,
            pinned: evaluator.pin_cards,
          )
          # e.g. primary_collection_cards or link_collection_cards
          card_relation = "#{evaluator.card_relation}_collection_cards"
          collection.send(card_relation) << cc
        end
      end

      if evaluator.parent_collection
        collection.parent_collection_card = build(
          :collection_card,
          parent: evaluator.parent_collection,
          order: evaluator.parent_collection.collection_cards.count,
          width: 1,
          height: 1,
          pinned: evaluator.pin_cards,
        )
      end
    end

    after(:create) do |collection, evaluator|
      if evaluator.add_editors.present?
        collection.unanchor_and_inherit_roles_from_anchor!
        evaluator.add_editors.each do |user|
          user.add_role(Role::EDITOR, collection)
        end
      end
      if evaluator.add_content_editors.present?
        collection.unanchor_and_inherit_roles_from_anchor!
        evaluator.add_content_editors.each do |user|
          user.add_role(Role::CONTENT_EDITOR, collection)
        end
      end
      if evaluator.add_viewers.present?
        collection.unanchor_and_inherit_roles_from_anchor!
        evaluator.add_viewers.each do |user|
          user.add_role(Role::VIEWER, collection)
        end
      end
    end
  end
end
