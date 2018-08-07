FactoryBot.define do
  factory :comment_thread do
    organization factory: :organization_without_groups
    transient do
      num_comments 0
      add_followers []
      add_group_followers []
    end

    factory :item_comment_thread do
      record factory: :file_item
      record_type 'Item'
    end

    factory :collection_comment_thread do
      record factory: :collection
      record_type 'Collection'
    end

    after(:build) do |comment_thread, evaluator|
      if evaluator.num_comments > 0
        1.upto(evaluator.num_comments) do
          comment_thread.comments << build(:comment, comment_thread: comment_thread)
        end
      end
    end

    after(:create) do |comment_thread, evaluator|
      if evaluator.add_followers.present?
        evaluator.add_followers.each do |user|
          comment_thread.add_user_follower!(user.id)
        end
      end
      if evaluator.add_group_followers.present?
        evaluator.add_group_followers.each do |group|
          comment_thread.add_group_follower!(group.id)
        end
      end
    end
  end
end
