class UpdateTemplateInstancesWorker
  include Sidekiq::Worker

  def perform(master_template_id, updated_card_ids, template_update_action)
    master_template = Collection.find(master_template_id)
    return unless master_template.present?

    template_instance_updater = TemplateInstanceUpdater.new(
      master_template: master_template,
      updated_card_ids: updated_card_ids,
      template_update_action: template_update_action,
    )
    template_instance_updater.call
  end
end
