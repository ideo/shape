class TemplateInstanceCardUpdater < SimpleService
  def initialize(instance_card:, master_card:, master_template:)
    @instance_card = instance_card
    @master_card = master_card
    @master_template = master_template
  end

  def call
    copy_card_attributes!

    return unless @master_template.is_a?(Collection::TestCollection) || @instance_card.item.is_a?(Item::TextItem)

    if @master_template.is_a?(Collection::TestCollection) && @master_template.inside_a_submission_box_template?
      TemplateInstanceQuestionCardUpdater.call(
        instance_card: @instance_card,
        master_card: @master_card,
        master_template: @master_template,
      )
    elsif @instance_card.item.is_a?(Item::TextItem)
      TemplateInstanceTextCardUpdater.call(
        instance_card: @instance_card,
        master_card: @master_card,
        master_template: @master_template,
      )
    end
  end

  private

  def copy_card_attributes!
    @instance_card.update_columns(
      height: @master_card.height,
      width: @master_card.width,
      order: @master_card.order,
      pinned: @master_card.pinned,
    )
  end
end
