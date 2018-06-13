FactoryBot.define do
  factory :comment do
    author
    message { Faker::Simpsons.quote }
    draftjs_data do
      {
        'entityMap' => {},
        'blocks' => [
          {
            'key' => 'dhdfp',
            'data' => {},
            'text' => Faker::Simpsons.quote,
            'type' => 'unstyled',
            'depth' => 0,
            'entityRanges' => [],
            'inlineStyleRanges' => [],
          },
        ],
      }
    end
  end
end
