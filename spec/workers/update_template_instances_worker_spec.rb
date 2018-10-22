require 'rails_helper'

RSpec.describe UpdateTemplateInstancesWorker, type: :worker do
  describe '#perform' do
    let(:master_template) { create(:collection, master_template: true, num_cards: 3) }

    it 'calls #update_template_instances' do
      allow_any_instance_of(Collection).to receive(:update_template_instances)
      expect_any_instance_of(Collection).to receive(:update_template_instances)
      UpdateTemplateInstancesWorker.new.perform(master_template.id)
    end
  end
end
