require 'rails_helper'

RSpec.describe Item::TextItem, type: :model do
  context 'validations' do
    it { should validate_presence_of(:content) }
    it { should validate_presence_of(:text_data) }
  end

  context 'callbacks' do
    let(:text_item) { create(:text_item, name: nil, content: 'This is some longer content that will get truncated') }

    it 'should truncate the content to create an item name' do
      expect(text_item.name).to eq 'This is some longer'
    end
  end
end
