require 'rails_helper'

RSpec.describe FilestackFile, type: :model do
  context 'validations' do
    it { should validate_presence_of(:url) }
    it { should validate_presence_of(:handle) }
  end

  context 'associations' do
    it { should have_one :item }
  end

  describe '#filename_without_extension' do
    context 'with apple.jpg' do
      let(:filestack_file) { build(:filestack_file, filename: 'apple.jpg') }

      it 'should return apple' do
        expect(filestack_file.filename_without_extension).to eq('apple')
      end
    end

    context 'with blank filename' do
      let(:filestack_file) { build(:filestack_file, filename: nil) }

      it 'should return nil' do
        expect(filestack_file.filename_without_extension).to be_nil
      end
    end
  end
end
