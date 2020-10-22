# == Schema Information
#
# Table name: items
#
#  id                         :bigint(8)        not null, primary key
#  archive_batch              :string
#  archived                   :boolean          default(FALSE)
#  archived_at                :datetime
#  background_color           :string
#  background_color_opacity   :float            default(1.0)
#  breadcrumb                 :jsonb
#  cached_attributes          :jsonb
#  content                    :text
#  data_content               :jsonb
#  data_settings              :jsonb
#  data_source_type           :string
#  icon_url                   :string
#  last_broadcast_at          :datetime
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

    has_many :question_choices, -> { order(order: :asc) }

    validate on: :create do
      if question_idea? && parent.present? && parent.collection_cards.count > 6
        errors.add(:base, 'too many ideas')
      end
    end

    delegate :gives_incentive?,
             to: :test_collection,
             prefix: true,
             allow_nil: true

    after_create :create_question_dataset
    after_create :add_default_question_choices,
                 if: :question_choices_customizable?

    after_update :update_test_open_responses_collection,
                 if: :update_test_open_responses_collection?

    after_update :update_test_open_responses_collection,
                 if: :update_test_open_responses_collection?

    after_create :set_price_per_response_on_test_audiences,
                 if: :test_collection_gives_incentive?

    after_update :set_price_per_response_on_test_audiences,
                 if: :update_test_audience_price_after_update?

    scope :scale_questions, -> {
      where(
        question_type: question_type_categories[:scaled_rating],
      )
    }
    scope :graphable_questions, -> {
      where(
        question_type: question_type_categories[:scaled_rating] + %i[question_single_choice question_multiple_choice],
      )
    }

    amoeba do
      recognize [:has_many]
      include_association :question_choices
    end

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
          question_single_choice
          question_multiple_choice
        ],
      }
    end

    def self.scale_answer_numbers
      (1..4).to_a
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

    def test_collection
      parents.find_by(type: 'Collection::TestCollection')
    end

    def question_title_and_description
      return customizable_title_and_description if question_choices_customizable?

      self.class.question_title_and_description(question_type)
    end

    def question_title
      question_title_and_description[:title]
    end

    def question_description(with_content: false)
      description = question_title_and_description[:description]
      return "#{description} #{content}?" if question_category_satisfaction? && with_content

      description
    end

    def scale_question?
      self.class.question_type_categories[:scaled_rating].include?(question_type&.to_sym)
    end

    def question_choices_customizable?
      question_single_choice? || question_multiple_choice?
    end

    def graphable_question?
      scale_question? || question_choices_customizable?
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

    def score_of_best_idea
      return unless scale_question?

      # answers are 1-4, but scored on a scale of 0-3
      # TODO: change the answer_numbers on the emojiScale to go 0-3 to match? (would need to migrate old answers)

      # get the score of the max scoring idea for this question
      points_by_idea = completed_survey_answers.group(:idea_id).sum('answer_number - 1').sort_by { |_idea, points| points }.reverse
      return 0 if points_by_idea.empty?

      idea_id, points = points_by_idea.first
      total = completed_survey_answers.where(idea_id: idea_id).count * 3
      # don't want to divide by 0
      return 0 if total.zero?

      (points * 100.0 / total).round
    end

    def unarchived_question_choices
      # Don't consider archived choices when validating completeness of question
      question_choices.reject(&:archived)
    end

    # TODO: these dataset creation methods should really be broken out into a service

    def org_wide_question_dataset
      org_grouping = [{ type: 'Organization', id: organization.id }]

      dataset = Dataset::Question.where(
        question_type: question_type,
        identifier: Dataset::Question::DEFAULT_ORG_NAME,
        chart_type: :bar,
      ).where(
        'groupings @> ?',
        org_grouping.to_json,
      ).first

      return dataset if dataset.present?

      org_data_source = question_choices_customizable? ? self : nil
      Dataset::Question.create(
        question_type: question_type,
        identifier: Dataset::Question::DEFAULT_ORG_NAME,
        chart_type: :bar,
        groupings: org_grouping,
        data_source: org_data_source,
      )
    end

    def create_test_audience_dataset(test_audience:, data_item:, idea: nil)
      groupings = [{ type: 'TestAudience', id: test_audience.id }]
      identifier = Dataset.identifier_for_object(test_audience)
      if idea.present?
        groupings.push(type: 'Item', id: idea.id)
        identifier += Dataset.identifier_for_object(idea)
      end

      audience_dataset = Dataset::Question.create(
        groupings: groupings,
        question_type: question_type,
        chart_type: :bar,
        data_source: self,
        identifier: identifier,
      )
      data_item.data_items_datasets.create(
        dataset: audience_dataset,
        selected: false,
      )
    end

    def create_idea_question_dataset(idea:, data_item:)
      idea_grouping = [{ type: 'Item', id: idea.id }]

      attrs = {
        question_type: question_type,
        chart_type: :bar,
        data_source: self,
        identifier: Dataset.identifier_for_object(idea),
      }

      idea_dataset = Dataset::Question.where(attrs)
                                      .where(
                                        'groupings @> ?', idea_grouping.to_json
                                      ).first
      idea_dataset ||= Dataset::Question.create(
        attrs.merge(
          groupings: idea_grouping,
        ),
      )

      return idea_dataset if data_item.data_items_datasets.find_by(dataset: idea_dataset).present?

      data_item.data_items_datasets.create(
        dataset: idea_dataset,
        selected: true,
      )
    end

    def create_survey_response_idea_dataset(survey_response:, idea:, data_item:)
      identifier = Dataset.identifier_for_object(survey_response) + Dataset.identifier_for_object(idea)
      response_dataset = Dataset::Question.create(
        groupings: [
          { type: 'SurveyResponse', id: survey_response.id },
          { type: 'Item', id: idea.id },
        ],
        question_type: question_type,
        chart_type: :bar,
        data_source: self,
        identifier: identifier,
      )
      data_item.data_items_datasets.create(
        dataset: response_dataset,
        selected: true,
      )
    end

    def add_default_question_choices
      return if question_choices.any?

      (0..3).each do |i|
        question_choices.create(
          value: i,
          order: i,
        )
      end
    end

    private

    def customizable_title_and_description
      {
        title: question_single_choice? ? 'Single Choice' : 'Multiple Choice',
        description: content,
      }
    end

    def create_question_dataset
      self.question_dataset = Dataset::Question.create(
        data_source: self,
        timeframe: :month,
        chart_type: :bar,
      )
    end

    def notify_test_design_collection_of_creation?
      parent.is_a?(Collection::TestDesign)
    end

    def notify_test_design_of_creation
      parent.question_item_created(self)
    end

    def update_test_open_responses_collection?
      saved_change_to_content? && test_open_responses_collection.present?
    end

    def update_test_open_responses_collection
      test_open_responses_collection.update(
        name: "#{content} Responses",
      )
    end

    def update_test_audience_price_after_update?
      test_collection_gives_incentive? && saved_change_to_archived?
    end

    def set_price_per_response_on_test_audiences
      test_collection.test_audiences.each(&:update_price_per_response_from_audience!)
    end
  end
end
