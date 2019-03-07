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

  describe '#transcode!' do
    let(:filestack_file) { create(:filestack_file) }
    let(:item) { create(:file_item, filestack_file: filestack_file) }

    context 'video file is already an mp4' do
      let(:filestack_file) { create(:filestack_file, mimetype: 'video/mp4') }

      it 'should skip transcoding' do
        expect(HTTParty).not_to receive(:get)
        item.transcode!
      end
    end

    context 'video file is quicktime' do
      let(:filestack_file) { create(:filestack_file, mimetype: 'video/quicktime') }

      it 'should begin transcoding on filestack' do
        expect(HTTParty).to receive(:get).with(
          filestack_file.video_conversion_url,
        ).and_return(
          Hashie::Mash.new(
            body: { uuid: '123abc' }.to_json,
          ),
        )
        item.transcode!
        expect(item.pending_transcoding_uuid).to eq '123abc'
      end
    end
  end
end
