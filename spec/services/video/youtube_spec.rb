require 'rails_helper'

RSpec.describe Video::Youtube, type: :service do
  let(:valid_urls) do
    [
      'http://www.youtube.com/watch?v=-wtIM49CWuI',
      'http://www.youtube.com/v/-wtIM49CWuI?version=3&autohide=1',
      'http://youtu.be/-wtIM49CWuI',
      'http://www.youtube.com/oembed?url=http%3A//www.youtube.com/watch?v%3D-wtIM49CWuI&format=json',
    ]
  end

  let(:invalid_urls) do
    [
      'https://www.youtube.com/results?search_query=puppies',
      'https://vimeo.com/123456',
    ]
  end

  describe '.valid?' do
    it 'is true with valid urls' do
      valid_urls.each do |url|
        expect(Video::Youtube.new(url).valid_url?).to be true
      end
    end

    it 'is false with invalid urls' do
      invalid_urls.each do |url|
        expect(Video::Youtube.new(url).valid_url?).to be false
      end
    end
  end

  describe '.video_id' do
    it 'returns id if valid' do
      valid_urls.each do |url|
        id = Video::Youtube.new(url).video_id
        expect(Video::Youtube.new(url).video_id).to eq('-wtIM49CWuI')
      end
    end

    it 'returns nil if invalid' do
      invalid_urls.each do |url|
        expect(Video::Youtube.new(url).video_id).to be_nil
      end
    end
  end
end
