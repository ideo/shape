module TemplateInstanceCard
  class TemplateInstanceQuestionCardUpdater < SimpleService
    def initialize(instance_card:, master_card:)
      @instance_card = instance_card
      @master_card = master_card
    end

    def call
      copy_test_details_from_master!
    end

    private

    def copy_test_details_from_master!
      # copy more details over if we are still setting up our submission template test

      test = @instance_card.parent
      return unless test.is_a?(Collection::TestCollection) && test.draft?

      # Skip if we reach the ideas collection
      return if @master_card.record.is_a?(Collection) || @instance_card.item.nil?

      @instance_card.item.update(
        type: @master_card.item.type,
        content: @master_card.item.content,
        url: @master_card.item.url,
        filestack_file_id: @master_card.item.filestack_file_id,
        question_type: @master_card.item.question_type,
      )
    end
  end
end
