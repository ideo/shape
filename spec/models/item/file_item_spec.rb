require 'rails_helper'

RSpec.describe Item::FileItem, type: :model do
  context 'validations' do
    it { should validate_presence_of(:filestack_file) }
  end

  describe '#generate_name' do
    let(:item) { create(:file_item) }
    let(:new_file) { create(:filestack_file) }

    it 'should generate the name from the filename' do
      expect(item.name).to eq item.filestack_file.filename_without_extension
    end

    it 'should generate the name from the filename when replacing with a new file' do
      item.update(name: nil, filestack_file: new_file)
      expect(item.name).to eq new_file.filename_without_extension
    end
  end
end
