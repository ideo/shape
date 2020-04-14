module TemplateInstanceCard
  class TemplateInstanceCardUpdater < SimpleService
    def initialize(instance_card:, master_card:, master_template:)
      @instance_card = instance_card
      @master_card = master_card
      @master_template = master_template
    end

    def call
      @instance_card.copy_card_attributes!(@master_card)

      if @master_template.is_a?(Collection::TestCollection) && @master_template.inside_a_submission_box_template?
        TemplateInstanceCard::TemplateInstanceQuestionCardUpdater.call(
          instance_card: @instance_card,
          master_card: @master_card,
        )
      elsif @instance_card.item.is_a?(Item::TextItem)
        TemplateInstanceCard::TemplateInstanceTextCardUpdater.call(
          instance_card: @instance_card,
          master_card: @master_card,
        )
      end

      # duplicate question choices when instances are duplicated
      if @master_card.record.is_a?(Item::QuestionItem) &&
         (@master_card.record.question_multiple_choice? || @master_card.record.question_single_choice?) &&
         @master_card.record.question_choices.present?
        duplicate_instance_question_choices
      end

      return unless @instance_card.archived?

      @instance_card.unarchive!
    end

    private

    def duplicate_instance_question_choices
      return unless @master_card.record&.question_choices&.any? && @instance_card.record&.question_choices&.any?

      master_question_choices = @master_card.record.question_choices.select { |choice| choice.text.present? }
      instance_question_choices = @instance_card.record.question_choices
      instance_choice_texts = instance_question_choices.pluck(:text)

      master_question_choices.each_with_index do |master_choice, i|
        master_choice_text = master_choice.text
        next unless instance_question_choices[i].blank? || instance_choice_texts.exclude?(master_choice_text)

        master_choice.duplicate!(assign_question: @instance_card.record)
      end
    end
  end
end
