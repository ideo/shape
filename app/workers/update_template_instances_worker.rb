class UpdateTemplateInstancesWorker
  include Sidekiq::Worker

  # TODO: add sidekiq rate limiter to throttle instance updates

  def perform(master_template_id)
    template = Collection.find(master_template_id)
    template.update_template_instances if template.present?
  end
end
