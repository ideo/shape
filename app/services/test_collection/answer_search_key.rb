module TestCollection
  class AnswerSearchKey

    def initialize(
      question: nil,
      question_type: nil,
      question_choice_id: nil,
      answer_number: nil,
      audience_id: nil,
      dont_include_test_answer_wrapper: false
    )
      @question = question
      @question_type = question_type
      @question_choice_id = question_choice_id
      @answer_number = answer_number
      @audience_id = audience_id
      @dont_include_test_answer_wrapper = dont_include_test_answer_wrapper
    end

    def for_test(test_id, idea_id = nil)
      return if question_choice_and_answer_number_blank?

      str = "test_#{test_id}"
      str += "_idea_#{idea_id}" if idea_id.present?

      query("#{str}#{question_key}#{answer_key}#{audience_key}")
    end

    def for_organization(organization_id)
      return if question_and_question_type_blank? && question_choice_and_answer_number_blank?

      query("organization_#{organization_id}#{org_wide_question_key}#{answer_key}#{audience_key}")
    end

    private

    def query(answer_key)
      return answer_key if @dont_include_test_answer_wrapper

      "test_answer(#{answer_key})"
    end

    def org_wide_question_key
      "_#{@question&.question_type || @question_type}"
    end

    def answer_key
      key = @question&.question_choices_customizable? ? @question_choice_id : @answer_number
      "_answer_#{key}"
    end

    def question_key
      "_question_#{@question.id}"
    end

    def audience_key
      return if @audience_id.blank?

      "_audience_#{@audience_id}"
    end

    def question_choice_and_answer_number_blank?
      @question_choice_id.blank? && @answer_number.blank?
    end

    def question_and_question_type_blank?
      @question.blank? && @question_type.blank?
    end
  end
end
