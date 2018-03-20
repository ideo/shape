require 'rails_helper'

RSpec.describe FilestackFile, type: :model do
  context 'validations' do
    it { should validate_presence_of(:url) }
    it { should validate_presence_of(:handle) }
    it { should validate_presence_of(:mimetype) }
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

  describe '#duplicate' do
    let!(:filestack_file) { create(:filestack_file) }

    it 'should create new object' do
      expect { filestack_file.duplicate! }.to change(FilestackFile, :count).by(1)
    end

    it 'should have the same url (for now)' do
      expect(filestack_file.duplicate!.url).to eq(filestack_file.url)
    end
  end
end
