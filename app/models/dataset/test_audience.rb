# == Schema Information
#
# Table name: test_audiences
#
#  id                 :bigint(8)        not null, primary key
#  price_per_response :decimal(10, 2)
#  sample_size        :integer
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  audience_id        :bigint(8)
#  test_collection_id :bigint(8)
#
# Indexes
#
#  index_test_audiences_on_audience_id         (audience_id)
#  index_test_audiences_on_test_collection_id  (test_collection_id)
#
# Foreign Keys
#
#  fk_rails_...  (audience_id => audiences.id)
#

class Dataset
  class Question < Dataset
    before_validation :set_default_timeframe
    belongs_to :question_item,
               foreign_key: 'data_source_id',
               class_name: 'Item::QuestionItem',
               optional: true

    delegate :question_type,
             to: :question_item,
             allow_nil: true

    def data
      data_report.call
    end

    def total
      data_report.total
    end

    def name
      # The collection name
      return if test_collection.blank?
      test_collection.name.sub(Collection::TestDesign::COLLECTION_SUFFIX, '')
    end

    def max_domain
      95
    end

    def title
      question_item.question_title
    end

    def description
      question_item.question_description
    end

    def test_collection_id
      test_collection&.id
    end

    def test_collection
      question_item&.parent
    end

    def measure
      :answer_count
    end

    private

    def data_report
      @data_report ||= DataReport::Question.new(dataset: self)
    end

    def set_default_timeframe
      self.timeframe = :ever
    end
  end
end
