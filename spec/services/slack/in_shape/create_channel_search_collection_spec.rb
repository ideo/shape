require 'rails_helper'

RSpec.describe Slack::InShape::CreateChannelSearchCollection, type: :service do
  describe '#call' do
    let!(:slack_root_collection) { create(:collection) }
    let(:channel) { 'contactlessworld' }
    subject do
      Slack::InShape::CreateChannelSearchCollection.new(
        channel: channel,
      )
    end

    before do
      ENV['SLACK_IN_SHAPE_COLLECTION_ID'] = slack_root_collection.id.to_s
    end

    context 'on the initial run' do
      it 'should create the All Content collection' do
        subject.call
        all_content_collection = subject.all_content_collection
        expect(all_content_collection.name).to eq 'All Content'
        expect(all_content_collection.parent_collection_card.identifier).to eq 'all-content'
        expect(all_content_collection.parent).to eq slack_root_collection
      end

      it 'should create the search collection' do
        subject.call
        search_collection = subject.search_collection
        expect(search_collection.name).to eq "##{channel}"
        expect(search_collection.parent_collection_card.identifier).to eq "slack-#{channel}"
        expect(search_collection.parent).to eq slack_root_collection
      end
    end

    context 'when run additional times' do
      it 'should only create collections the first run' do
        expect {
          subject.call
        }.to change(Collection, :count).by(2)
        # second run through...
        expect {
          subject.call
        }.not_to change(Collection, :count)
      end
    end
  end
end
