require 'rails_helper'

RSpec.describe Item::VideoItem, type: :model do
  context 'validations' do
    it { should validate_presence_of(:url) }
  end

  describe '#image_url' do
    let(:item) { create(:video_item) }

    it 'should return thumbnail_url' do
      expect(item.image_url).to eq item.thumbnail_url
    end
  end
end
