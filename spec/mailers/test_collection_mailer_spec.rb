require 'rails_helper'

RSpec.describe TestCollectionMailer, type: :mailer do
  let!(:collection_to_test) { create(:collection) }
  let!(:collection) do
    create(
      :test_collection,
      test_status: :live,
      test_launched_at: DateTime.new(2019, 5, 20, 8, 57),
      collection_to_test: collection_to_test
    )
  end
  let!(:audience) { create(:audience) }
  let!(:test_audience) { create(:test_audience, audience: audience, test_collection: collection) }

  describe '#notify_launch' do
    let(:mail) { TestCollectionMailer.notify_launch(collection.id) }

    it 'should send to the ideo support email' do
      expect(mail.to).to eql([Shape::ZENDESK_EMAIL])
    end

    it 'renders the subject' do
      expect(mail.subject).to eql("Shape Feedback: #{collection.name} launched | ID: #{collection.id}")
    end

    it 'renders to body' do
      body = mail.body.encoded
      expect(body).to include("Organization: #{collection.organization.name}")
      expect(body).to include("Test name: #{collection.name}")
      expect(body).to include("Test URL: http://test.shape.com//tests/#{collection.id}")
      expect(body).to include("Test ID: #{collection.id}")
      expect(body).to include("Test launched: 5/20/2019 08:57AM")
      expect(body).to include("Feedback collection URL: http://test.shape.com//collections/#{collection_to_test.id}")
      expect(body).to include("Feedback design collection URL: http://test.shape.com//collections/#{collection.id}")
      expect(body).to include("#{audience.name}: #{test_audience.sample_size}")
    end
  end
end
