require 'rails_helper'

RSpec.describe Controller::FilteredIndexLoader do
  let(:controller) { Api::V1::CollectionsController.new }
  let(:klass) { Collection }
  let(:filter) { { external_id: '99' } }
  let(:params) do
    {
      controller: 'collections',
      filter: filter,
    }
  end
  let(:application) { create(:application) }
  let(:service) {
    Controller::FilteredIndexLoader.new(
      controller: controller,
      params: params,
      page: 1,
      application: application,
    )
  }
  let(:results) { double('results') }

  before do
    allow(controller).to receive(:head).and_return(:unprocessable_entity_error)
    allow(results).to receive(:page).and_return(results)
  end

  context 'with external_id filter' do
    it 'should filter by external_id' do
      expect(klass).to receive(:where_external_id).with(
        '99',
        application_id: application.id,
      ).and_return(results)
      service.call
    end

    it 'should set the instance variable on the collection' do
      expect(klass).to receive(:where_external_id).with(
        '99',
        application_id: application.id,
      ).and_return(results)
      expect(controller).to receive(:instance_variable_set).with(
        '@collections',
        results,
      )
      service.call
    end

    context 'with no application present' do
      let(:application) { nil }
      it 'should return an error when filtering by external_id' do
        expect(service.call).to eq :unprocessable_entity_error
      end
    end
  end

  context 'with CollectionsController and no filters present' do
    let(:filter) { nil }
    it 'should return an error because filter is required' do
      expect(service.call).to eq :unprocessable_entity_error
    end
  end
end
