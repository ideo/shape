class Collection
  class TestCollection < Collection
    has_many :questions
    has_many :survey_responses
  end
end
