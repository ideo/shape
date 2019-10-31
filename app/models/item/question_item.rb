# == Schema Information
#
# Table name: items
#
#  id                         :bigint(8)        not null, primary key
#  archive_batch              :string
#  archived                   :boolean          default(FALSE)
#  archived_at                :datetime
#  breadcrumb                 :jsonb
#  cached_attributes          :jsonb
#  content                    :text
#  data_content               :jsonb
#  data_settings              :jsonb
#  data_source_type           :string
#  icon_url                   :string
#  legend_search_source       :integer
#  name                       :string
#  question_type              :integer
#  report_type                :integer
#  style                      :jsonb
#  thumbnail_url              :string
#  type                       :string
#  unarchived_at              :datetime
#  url                        :string
#  created_at                 :datetime         not null
#  updated_at                 :datetime         not null
#  cloned_from_id             :bigint(8)
#  data_source_id             :bigint(8)
#  filestack_file_id          :integer
#  legend_item_id             :integer
#  roles_anchor_collection_id :bigint(8)
#
# Indexes
#
#  index_items_on_archive_batch                        (archive_batch)
#  index_items_on_breadcrumb                           (breadcrumb) USING gin
#  index_items_on_cloned_from_id                       (cloned_from_id)
#  index_items_on_created_at                           (created_at)
#  index_items_on_data_source_type_and_data_source_id  (data_source_type,data_source_id)
#  index_items_on_question_type                        (question_type)
#  index_items_on_roles_anchor_collection_id           (roles_anchor_collection_id)
#  index_items_on_type                                 (type)
#

class Item
  class QuestionItem < Item
    has_many :question_answers, inverse_of: :question, foreign_key: :question_id, dependent: :destroy
    has_one :test_open_responses_collection, class_name: 'Collection::TestOpenResponses'
    has_one :question_dataset,
            -> { without_groupings },
            as: :data_source,
            class_name: 'Dataset::Question',
            dependent: :destroy
    # This includes question and audience datasets
    has_many :datasets,
             as: :data_source,
             class_name: 'Dataset::Question',
             dependent: :destroy
    has_many :data_items,
             as: :data_source,
             class_name: 'Item::DataItem'

    # TODO: Deprecate once migrating to datasets
    has_one :test_data_item, class_name: 'Item::DataItem', as: :data_source

    after_create :create_question_dataset

    after_update :update_test_open_responses_collection,
                 if: :update_test_open_responses_collection?

    after_update :update_test_open_responses_collection,
                 if: :update_test_open_responses_collection?

    scope :answerable, -> {
      where.not(
        question_type: unanswerable_question_types,
      )
    }
    scope :not_answerable, -> {
      where(
        question_type: unanswerable_question_types,
      )
    }
    scope :scale_questions, -> {
      where(
        question_type: question_type_categories[:scaled_rating],
      )
    }

    def self.question_type_categories
      {
        idea_content: %i[
          question_description
          question_media
          question_idea
        ],
        scaled_rating: %i[
          question_context
          question_useful
          question_excitement
          question_different
          question_clarity
          question_category_satisfaction
        ],
        customizable: %i[
          question_category_satisfaction
          question_context
          question_open
        ],
      }
    end

    def self.unanswerable_question_types
      %i[
        question_media
        question_description
        question_finish
        question_idea
      ]
    end

    def self.question_title_and_description(question_type = nil)
      case question_type&.to_sym
      when :question_useful
        {
          title: 'Usefulness',
          description: 'How useful is this idea for you?',
        }
      when :question_clarity
        {
          title: 'Clarity',
          description: 'How clear is this idea for you?',
        }
      when :question_excitement
        {
          title: 'Excitement',
          description: 'How exciting is this idea for you?',
        }
      when :question_different
        {
          title: 'Different',
          description: "How different is this idea from what you've seen before?",
        }
      when :question_category_satisfaction
        # the category text gets added later within ScaleQuestion
        {
          title: 'Category Satisfaction',
          description: 'How satisfied are you with your current',
        }
      when :question_context
        {
          title: 'Context',
          description: 'How satisfied are you with your current solution?',
        }
      when :total
        {
          title: 'Total',
          description: '',
        }
      else
        {}
      end
    end

    def question_title_and_description
      self.class.question_title_and_description(question_type)
    end

    def question_title
      question_title_and_description[:title]
    end

    def question_description
      question_title_and_description[:description]
    end

    def scale_question?
      self.class.question_type_categories[:scaled_rating].include?(question_type&.to_sym)
    end

    def requires_roles?
      # NOTE: QuestionItems defer their can_edit access to their parent collection.
      # this is defined in item.rb as to be shared by Questions / FileItems
      false
    end

    def completed_survey_answers
      question_answers
        .joins(:survey_response)
        .where(
          SurveyResponse.arel_table[:status].eq(:completed),
        )
    end

    def score
      return unless scale_question?

      # answers are 1-4, but scored on a scale of 0-3
      # TODO: change the answer_numbers on the emojiScale to go 0-3 to match? (would need to migrate old answers)
      points = completed_survey_answers.sum('answer_number - 1') || 0
      total = completed_survey_answers.count * 3
      # don't want to divide by 0
      return 0 if total.zero?

      (points * 100.0 / total).round
    end

    def find_or_create_response_graph(parent_collection:, initiated_by:, legend_item: nil)
      return if !scale_question? || test_data_item.present?

      legend_item ||= parent_collection.legend_item

      builder = CollectionCardBuilder.new(
        params: {
          order: parent_collection_card.order,
          height: 2,
          width: 2,
          item_attributes: {
            type: 'Item::DataItem',
            report_type: :report_type_question_item,
            legend_item_id: legend_item&.id,
          },
        },
        parent_collection: parent_collection,
        user: initiated_by,
      )
      builder.create
      if builder.collection_card.persisted?
        data_item = builder.collection_card.record
        question_dataset.data_items_datasets.create(
          data_item: data_item,
        )
        data_item.data_items_datasets.create(
          dataset: org_wide_question_dataset,
        )
      end

      builder.collection_card
    end

    def find_or_create_open_response_collection(parent_collection:, initiated_by:)
      return if !question_open? || test_open_responses_collection.present?

      builder = CollectionCardBuilder.new(
        params: {
          order: parent_collection_card.order,
          collection_attributes: {
            name: "#{content} Responses",
            type: 'Collection::TestOpenResponses',
            question_item_id: id,
          },
        },
        parent_collection: parent_collection,
        user: initiated_by,
      )
      builder.create
      builder.collection_card
    end

    def org_wide_question_dataset
      Dataset::Question.find_or_create_by(
        groupings: [{ type: 'Organization', id: organization.id }],
        question_type: question_type,
        identifier: Dataset::Question::DEFAULT_ORG_NAME,
        chart_type: :bar,
      )
    end

    def create_test_audience_dataset(test_audience, data_item)
      audience_dataset = Dataset::Question.create(
        groupings: [{ type: 'TestAudience', id: test_audience.id }],
        question_type: question_type,
        chart_type: :bar,
        data_source: self,
        identifier: Dataset.identifier_for_object(test_audience),
      )
      data_item.data_items_datasets.create(
        dataset: audience_dataset,
        selected: false,
      )
    end

    private

    def create_question_dataset
      self.question_dataset = Dataset::Question.create(
        data_source: self,
        timeframe: :month,
        chart_type: :bar,
      )
    end

    # def test_collection_is_live?
    #   parent.is_a?(Collection::TestCollection) && parent.live?
    # end
    #
    # def notify_test_collection_of_creation
    #   parent.question_item_created(self)
    # end

    def update_test_open_responses_collection?
      saved_change_to_content? && test_open_responses_collection.present?
    end

    def update_test_open_responses_collection
      test_open_responses_collection.update(
        name: "#{content} Responses",
      )
    end
  end
end
