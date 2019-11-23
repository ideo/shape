# This is currently only applicable to Collections
module Testable
  extend ActiveSupport::Concern

  included do
    has_many :test_collections,
             inverse_of: :collection_to_test,
             foreign_key: :collection_to_test_id,
             class_name: 'Collection::TestCollection'

    has_one :live_test_collection,
            -> { active.live },
            inverse_of: :collection_to_test,
            foreign_key: :collection_to_test_id,
            class_name: 'Collection::TestCollection'
  end

  class_methods do
    def order_by_score(question_type)
      where
        .not(cached_test_scores: nil)
        .order(Arel.sql("cached_test_scores->'#{question_type}' DESC NULLS LAST"))
    end
  end

  # NOTE: For now, this is only applicable to tests within submission box submissions
  def collect_test_scores
    scores = {}
    return scores unless submission_attrs.present?

    launchable_test = Collection.find_by(id: submission_attrs['launchable_test_id'])
    return scores unless launchable_test.present?

    launchable_test.question_items.scale_questions.each do |question|
      scores[question.question_type] = question.score_of_best_idea
    end
    unless scores.empty?
      # total == average score
      scores['total'] = launchable_test.score_of_best_idea
    end
    scores
  end

  def cache_test_scores!
    self.cached_test_scores = collect_test_scores
    save
  end
end
