module TemplateInstanceCard
  class TemplateInstanceTextCardUpdater < SimpleService
    def initialize(instance_card:, master_card:)
      @instance_card = instance_card
      @master_card = master_card
    end

    def call
      @master_card.item.reload
      copy_data_content_from_master!
    end

    private

    def copy_data_content_from_master!
      master_data_content = Mashie.new(@master_card.item.data_content)
      return if @instance_card.item.version.to_i > @master_card.item.version.to_i || @instance_card.item.activities.where_participated.any?

      @instance_card.item.update(data_content: Mashie.new(ops: master_data_content.ops, version: master_data_content.version))
    end
  end
end
