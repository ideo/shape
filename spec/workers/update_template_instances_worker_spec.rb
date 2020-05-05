require 'rails_helper'

RSpec.describe UpdateTemplateInstancesWorker, type: :worker do
  describe '#perform' do
    let(:master_template) { create(:collection, master_template: true, num_cards: 3) }

    it 'calls #update_template_instances' do
      expect_any_instance_of(TemplateInstanceUpdater).to receive(:call)
      UpdateTemplateInstancesWorker.new.perform(master_template.id, master_template.collection_cards.pluck(:id), :update_all)
    end
  end
end
