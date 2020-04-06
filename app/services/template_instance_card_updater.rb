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
      copy_test_details_from_master!
    elsif @instance_card.item.is_a?(Item::TextItem)
      @master_card.item.reload
      copy_data_content_from_master!
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

  def copy_test_details_from_master!
    # copy more details over if we are still setting up our submission template test
    test = @instance_card.parent
    return unless test.is_a?(Collection::TestCollection) && test.draft?
    # Skip if we reach the ideas collection
    return if @master_card.record.is_a?(Collection)

    @instance_card.item.update(
      type: @master_card.item.type,
      content: @master_card.item.content,
      url: @master_card.item.url,
      filestack_file_id: @master_card.item.filestack_file_id,
      question_type: @master_card.item.question_type,
    )
  end

  def copy_data_content_from_master!
    master_data_content = Mashie.new(@master_card.item.data_content)
    return if @instance_card.item.activities.where_participated.any?
    return if @instance_card.item.version > @master_card.item.version

    @instance_card.item.update(data_content: Mashie.new(ops: master_data_content.ops, version: master_data_content.version))
  end
end
