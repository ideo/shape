# This is currently only applicable to Collections
module Testable
  extend ActiveSupport::Concern

  included do
    has_many :test_collections,
             inverse_of: :collection_to_test,
             foreign_key: :collection_to_test_id,
             class_name: 'Collection::TestCollection'

    # has_one :latest_test_collection,
    #         -> { active.where(test_status: %i[live closed]).order(updated_at: :desc) },
    #         inverse_of: :collection_to_test,
    #         foreign_key: :collection_to_test_id,
    #         class_name: 'Collection::TestCollection'

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
        .order("cached_test_scores->'#{question_type}' DESC NULLS LAST")
    end
  end

  # NOTE: For now, this is only applicable to tests within submission box submissions
  def collect_test_scores
    scores = {}
    return score unless submission_attrs.present?
    launchable_test = Collection.find_by(id: submission_attrs['launchable_test_id'])
    return scores unless launchable_test.present?
    launchable_test.question_items.scale_questions.each do |question|
      scores[question.question_type] = question.score
    end
    unless scores.empty?
      # total == average score
      scores['total'] = (scores.values.sum / scores.values.count).round
    end
    scores
  end

  def cache_test_scores!
    self.cached_test_scores = collect_test_scores
    save
  end
end
