require 'rails_helper'

RSpec.describe Item::ImageItem, type: :model do
  context 'validations' do
    it { should validate_presence_of(:filestack_file) }
  end

  describe '#image_url' do
    let(:item) { create(:image_item) }

    it 'should return filestack_file_url' do
      expect(item.image_url).to eq item.filestack_file_url
    end

    it 'should have a generated name' do
      expect(item.filestack_file.filename_without_extension).to include item.name
    end
  end
end
