module TestCollection
  class AnswerSearchKey
    delegate :question, to: :@answer

    def initialize(answer, audience_id = nil)
      @answer = answer
      @audience_id = audience_id
    end

    def for_test(test_id, idea_id = nil)
      return if @answer.blank?

      str = "test_#{test_id}"
      str += "_idea_#{idea_id}" if idea_id.present?

      "#{str}#{question_key}#{audience_key}"
    end

    def for_organization(organization_id)
      return if @answer.blank?

      "organization_#{organization_id}_#{org_wide_question_key}#{audience_key}"
    end

    private

    def org_wide_question_key
      answer_num = question.question_choices_customizable? ? @answer.question_choice_id : @answer.answer_number
      "_question_#{question.question_type}_answer_#{answer_num}"
    end

    def question_key
      answer_num = question.question_choices_customizable? ? @answer.id : @answer.answer_number
      "_question_#{question.id}_answer_#{answer_num}"
    end

    def audience_key
      return if @audience_id.blank?

      "_audience_#{@audience_id}"
    end
  end
end
