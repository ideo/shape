FactoryBot.define do
  factory :comment_thread do
    organization
    transient do
      num_comments 0
      add_followers []
    end

    factory :item_comment_thread do
      record factory: :image_item
      record_type 'Item'
    end

    factory :collection_comment_thread do
      record factory: :collection
      record_type 'Collection'
    end

    after(:build) do |comment_thread, evaluator|
      if evaluator.num_comments > 0
        1.upto(evaluator.num_comments) do |i|
          comment_thread.comments << build(:comment, comment_thread: comment_thread)
        end
      end
    end

    after(:create) do |comment_thread, evaluator|
      if evaluator.add_followers.present?
        evaluator.add_followers.each do |user|
          comment_thread.add_user_follower!(user)
        end
      end
    end
  end
end
