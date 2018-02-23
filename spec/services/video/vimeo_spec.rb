require 'rails_helper'

RSpec.describe Video::Vimeo, type: :service do
  let(:valid_urls) do
    [
      'http://vimeo.com/12345678',
      'http://www.vimeo.com/12345678',
      'https://vimeo.com/12345678',
      'https://www.vimeo.com/12345678?param=1',
      'https://vimeo.com/12345678?param=1',
    ]
  end

  let(:invalid_urls) do
    [
      'http://www.youtube.com/watch?v=-wtIM49CWuI',
      'https://vimeo.com/channels/12345678',
    ]
  end

  describe '.valid?' do
    it 'is true with valid urls' do
      valid_urls.each do |url|
        expect(Video::Vimeo.new(url).valid_url?).to be true
      end
    end

    it 'is false with invalid urls' do
      invalid_urls.each do |url|
        expect(Video::Vimeo.new(url).valid_url?).to be false
      end
    end
  end

  describe '.video_id' do
    it 'returns id if valid' do
      valid_urls.each do |url|
        expect(Video::Vimeo.new(url).video_id).to eq('12345678')
      end
    end

    it 'returns nil if invalid' do
      invalid_urls.each do |url|
        expect(Video::Vimeo.new(url).video_id).to be_nil
      end
    end
  end
end
