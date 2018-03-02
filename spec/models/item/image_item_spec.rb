require 'rails_helper'

RSpec.describe Item::ImageItem, type: :model do
  context 'validations' do
    it { should validate_presence_of(:filestack_file) }
  end

  describe '#duplicate' do
    let!(:item) { create(:image_item) }

    it 'clones the filestack item' do
      original = item.filestack_file
      duplicated = item.duplicate!.filestack_file
      expect(duplicated.persisted?).to be true
      expect(original.id).not_to eq(duplicated.id)
    end
  end
end
