FactoryBot.define do
  factory :comment do
    author
    comment_thread factory: :item_comment_thread
    message { Faker::TvShows::Simpsons.quote }
    draftjs_data do
      {
        'entityMap' => {},
        'blocks' => [
          {
            'key' => 'dhdfp',
            'data' => {},
            'text' => Faker::TvShows::Simpsons.quote,
            'type' => 'unstyled',
            'depth' => 0,
            'entityRanges' => [],
            'inlineStyleRanges' => [],
          },
        ],
      }
    end

    transient do
      add_mentions []
      add_group_mentions []
    end
    after(:build) do |comment, evaluator|
      if evaluator.add_mentions.present?
        evaluator.add_mentions.each_with_index do |mention, i|
          comment.draftjs_data['entityMap'][i] = {
            type: 'mention',
            data: {
              mention: {
                id: "#{mention.id}__users",
                name: '@username',
              },
            },
          }
        end
      end
      if evaluator.add_group_mentions.present?
        evaluator.add_group_mentions.each_with_index do |mention, i|
          comment.draftjs_data['entityMap'][i + evaluator.add_mentions.count] = {
            type: 'mention',
            data: {
              mention: {
                id: "#{mention.id}__groups",
                name: '@groupname',
              },
            },
          }
        end
      end
    end
  end
end
