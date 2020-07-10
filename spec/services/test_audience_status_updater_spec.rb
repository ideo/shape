require 'rails_helper'

RSpec.describe TestAudienceStatusUpdater, type: :service do
  describe '#call' do
    let(:user) { create(:user) }
    let(:test_collection) { create(:test_collection, :with_test_audience) }
    let(:test_audience) { test_collection.test_audiences.paid.first }
    let(:status) { :closed }
    let(:updater) do
      TestAudienceStatusUpdater.new(test_audience: test_audience, status: status)
    end

    it 'should update test audience settings' do
      updater.call
      expect(test_audience.status).to eq(status.to_s)
    end

    context 'with submission box template instance tests' do
      let(:submission_box) { create(:submission_box, add_editors: [user]) }
      let(:template) { create(:collection, master_template: true, parent_collection: submission_box) }
      let!(:test_collection) { create(:test_collection, :with_test_audience, :completed, num_cards: 1, parent_collection: template) }
      let!(:submission_template_instance) { create(:collection, parent_collection: submission_box) }
      let!(:submission_test) { create(:test_collection, :completed, num_cards: 1, parent_collection: submission_template_instance, template_id: test_collection.id) }
      let!(:updater) do
        TestAudienceStatusUpdater.new(test_audience: test_audience, status: status)
      end

      before do
        # NOTE: reassign submission box template
        submission_box.update(submission_template_id: template.id)
        submission_box.reload
      end

      it 'should copy over audience setting for test instances' do
        updater.call
        expect(submission_test.reload.test_audiences.last.status).to eq(status.to_s)
      end
    end
  end
end
