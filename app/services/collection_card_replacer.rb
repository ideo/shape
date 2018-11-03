# With replace, we are keeping the card and item record, but changing the item data
class CollectionCardReplacer
  attr_reader :replacing_card, :errors

  def initialize(replacing_card:, params:)
    @replacing_card = replacing_card
    @item = @replacing_card.item
    @params = params
    @errors = nil
  end

  def replace
    if @item.blank? || @params[:item_attributes].blank?
      @replacing_card.errors.add(:item, "can't be blank")
      @errors = @replacing_card.errors
      return false
    end
    @errors = @item.errors
    assign_item_attributes
    @item.save
  end

  private

  def assign_item_attributes
    # clear item's existing attrs, keeping the original id / created_at
    # NOTE: is there a more proper way to do this?
    @item.attributes = Item.new(
      id: @item.id,
      created_at: @item.created_at,
      updated_at: Time.now,
    ).attributes
    # set the passed in attrs
    @item.attributes = @params[:item_attributes]
    # the class type may have changed
    @item = @item.becomes(@params[:item_attributes][:type].constantize)
  end
end
