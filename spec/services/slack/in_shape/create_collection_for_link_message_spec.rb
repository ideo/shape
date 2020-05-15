require 'rails_helper'

RSpec.describe Slack::InShape::CreateCollectionForLinkMessage, type: :service do
  describe '#call' do
    let!(:slack_root_collection) { create(:collection) }
    let(:channel) { 'contactlessworld' }
    let(:username) { 'greg' }
    let(:timestamp) { '1355517523.000005' }
    let(:identifier) do
      "#{channel}-#{username}-#{timestamp}"
    end
    let(:html_text) { "<p>Live long and <i>prosper</i>. <a href=\"https://google.com\">My Link</a></p>\n" }
    let(:plain_text) { 'Live long and prosper. My Link' }

    let(:all_content_collection) do
      CollectionCard.find_by(
        parent_id: slack_root_collection.id,
        identifier: Slack::InShape::Shared::ALL_CONTENT,
      )&.collection
    end
    let(:message_collection) do
      CollectionCard.find_by(
        parent_id: all_content_collection.id,
        identifier: identifier,
      ).collection
    end

    subject do
      Slack::InShape::CreateCollectionForLinkMessage.new(
        channel: channel,
        html_text: html_text,
        user: username,
        timestamp: timestamp,
        urls: %w[https://google.com https://shape.space],
      )
    end

    before do
      ENV['SLACK_IN_SHAPE_COLLECTION_ID'] = slack_root_collection.id.to_s
      # this service will use the all_content_collection created here
      Slack::InShape::CreateChannelSearchCollection.call(
        channel: channel,
      )
    end

    it 'creates a collection for the message in the all_content_collection' do
      expect {
        subject.call
      }.to change(Collection, :count).by(1)
      expect(message_collection).to eq Collection.last
      expect(message_collection.parent).to eq all_content_collection
      expect(message_collection.name).to eq plain_text
    end

    it 'creates link card(s)' do
      expect {
        subject.call
      }.to change(Item::LinkItem, :count).by(2)
      links = message_collection.items.first(2)
      expect(links.pluck(:type).uniq).to eq %w[Item::LinkItem]
      expect(links.first.name).to eq 'https://google.com'
      expect(links.first.url).to eq 'https://google.com'
    end

    it 'creates a text card' do
      expect {
        subject.call
      }.to change(Item::TextItem, :count).by(1)
      text = message_collection.items.last
      expect(text.name).to eq plain_text
      data_content = QuillContentConverter.new(html_text).html_to_quill_ops.as_json
      data_content['version'] = 1
      expect(text.data_content).to eq data_content
    end
  end
end
