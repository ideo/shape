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

  describe '.security_token' do
    it 'should return a filestack token' do
      expect(FilestackFile.security_token.keys).to match_array(%i[policy signature])
    end
  end

  describe '.signed_url' do
    let(:handle) { 'xyz123' }

    it 'should return a signed filestack URL' do
      signed_url = FilestackFile.signed_url(handle)
      expect(signed_url).to include("https://process.filestackapi.com/#{ENV['FILESTACK_API_KEY']}")
      expect(signed_url).to include('security=policy:')
      expect(signed_url).to include(handle)
    end
  end

  describe '#signed_url' do
    let(:filestack_file) { create(:filestack_file) }
    let(:signed_url) { 'https://process.filestackapi.com/signed/url' }

    it 'should call the class method to return a signed filestack URL' do
      expect(FilestackFile).to receive(:signed_url).and_return(signed_url)
      expect(filestack_file.signed_url).to eq signed_url
    end
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
