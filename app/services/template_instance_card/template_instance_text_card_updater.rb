class TemplateInstanceTextCardUpdater < SimpleService
  def initialize(instance_card:, master_card:, master_template:)
    @instance_card = instance_card
    @master_card = master_card
    @master_template = master_template
  end

  def call
    return unless @instance_card.item.is_a?(Item::TextItem)

    @master_card.item.reload
    copy_data_content_from_master!
  end

  private

  def copy_data_content_from_master!
    master_data_content = Mashie.new(@master_card.item.data_content)
    return if @instance_card.item.version.to_i > @master_card.item.version.to_i

    @instance_card.item.update(data_content: Mashie.new(ops: master_data_content.ops, version: master_data_content.version))
  end
end
