require 'rails_helper'

describe Collection::TestCollection, type: :model do
  context 'associations' do
    it { should have_many :survey_responses }
  end

  context 'callbacks' do
    let(:test_collection) { create(:test_collection) }

    it 'should create the default setup with its attached cards and items' do
      expect(test_collection.collection_cards.count).to eq 4
      expect(test_collection.items.count).to eq 4
    end
  end
end
