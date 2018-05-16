FactoryBot.define do
  factory :comment_thread do
    transient do
      num_comments 0
    end

    factory :item_comment_thread do
      record factory: :image_item
      record_type 'Item'
    end

    after(:build) do |comment_thread, evaluator|
      if evaluator.num_comments > 0
        1.upto(evaluator.num_comments) do |i|
          comment_thread.comments << build(:comment, comment_thread: comment_thread)
        end
      end
    end
  end
end
