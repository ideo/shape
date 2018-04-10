require 'rails_helper'

RSpec.describe SearchkickReindexWorker, type: :worker do
  describe '#perform' do
    it 'calls Searchkick::ProcessQueueJob' do
      expect(Searchkick::ProcessQueueJob).to receive(:perform_later).with(
        class_name: 'Collection',
      )
      SearchkickReindexWorker.new.perform
    end
  end
end
