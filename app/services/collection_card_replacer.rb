# With replace, we are keeping the card and item record, but changing the item data
class CollectionCardReplacer
  attr_reader :replacing_card, :errors

  def initialize(replacing_card:, params:)
    @replacing_card = replacing_card
    @item = @replacing_card.item
    @image_contain = params[:image_contain]
    @attrs = params[:item_attributes]
    @errors = nil
  end

  def replace
    if @item.blank? || @attrs.blank?
      @replacing_card.errors.add(:item, "can't be blank")
      # initially use card errors
      @errors = @replacing_card.errors
      return false
    end
    @replacing_card.update(image_contain: @image_contain) unless @image_contain.nil?
    # now capture errors on the item
    @errors = @item.errors
    assign_item_attributes
    result = @item.save
    @replacing_card.touch
    check_parent_collection_cover
    update_template_instances
    update_test_results_content_if_live
    result
  end

  private

  def assign_item_attributes
    # clear item's existing attrs, keeping the original id / created_at
    # NOTE: is there a more proper way to do this?
    @item.attributes = Item.new(
      id: @item.id,
      created_at: @item.created_at,
      roles_anchor_collection_id: @item.roles_anchor_collection_id,
      updated_at: Time.now,
    ).attributes
    # set the passed in attrs
    @item.attributes = @attrs
    # the class type may have changed
    @item = @item.becomes(@attrs[:type].constantize)

    if @item.is_a?(Item::QuestionItem)
      if @item.question_choices_customizable?
        @item.add_default_question_choices
      else
        @item.question_choices.destroy_all
      end
    end

    # clearing data means removing any existing translated content
    @item.translations.destroy_all

    # this needs to happen after the @item.becomes
    return unless @attrs[:filestack_file_attributes].present?

    @item.filestack_file_attributes = @attrs[:filestack_file_attributes]
  end

  def check_parent_collection_cover
    return unless @replacing_card.should_update_parent_collection_cover?

    @replacing_card.parent.cache_cover!
  end

  def update_template_instances
    return unless @replacing_card.parent.submission_box_template_test?

    @replacing_card.parent.queue_update_template_instances(
      updated_card_ids: @replacing_card.parent.collection_cards.pluck(:id),
      template_update_action: :update_all,
    )
  end

  def update_test_results_content_if_live
    return unless @item.is_a?(Item::QuestionItem)

    test_collection = @replacing_card.parent
    return unless test_collection.live_or_was_launched? &&
                  test_collection.test_results_collection.present?

    TestResultsCollection::CreateContentWorker.perform_async(
      test_collection.test_results_collection.id,
      nil,
      @replacing_card.id,
    )
  end
end
