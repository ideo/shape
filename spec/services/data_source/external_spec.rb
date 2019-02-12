require 'rails_helper'

RSpec.describe DataSource::External, type: :service do
  let(:chart_item) do
    create(:chart_item, :with_remote_url)
  end

  subject {
    DataSource::External.call(
      chart_item: chart_item,
    )
  }

  describe '#call' do
    let(:chart_item_file_path) do
      File.join(Dir.pwd, 'spec', 'support', 'api', 'chart_item_sample_response.json')
    end
    let(:chart_item_response) do
      JSON.parse(File.read(chart_item_file_path))
    end
    let(:successful_response) do
      instance_double('HTTParty::Response', {
        code: 200,
        body: {
          data: chart_item_response,
          errors: [],
        }
      }.deep_stringify_keys)
    end
    before do
      allow(HTTParty).to receive(:get).and_return(successful_response)
    end

    it 'loads external url' do
      expect(HTTParty).to receive(:get).with(
        chart_item.url,
      )
      subject
    end

    it 'returns data from url' do
      expect(subject.deep_stringify_keys).to eq(
        chart_item_response['attributes'],
      )
    end

    context 'non-success status' do
      let(:failure_response) do
        instance_double('HTTParty::Response', {
          code: 500,
          body: {
            data: {},
            errors: [
              'Something bad happened',
            ]
          }
        }.deep_stringify_keys)
      end
      before do
        allow(HTTParty).to receive(:get).and_return(failure_response)
      end

      it 'returns error in title' do
        expect(subject[:title]).to eq('Could not load data')
        expect(subject[:datasets]).to be_empty
      end
    end
  end
end
