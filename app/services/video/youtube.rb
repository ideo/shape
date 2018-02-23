module Video
  class Youtube
    def initialize(url)
      @url = url
    end

    def valid_url?
      video_id.present?
    end

    def video_id
      # youtube.com
      if uri.host.match(/youtube\.com$/).present?
        # youtube.com/v/id
        match = uri.path.match(%r{^\/v\/(?<id>#{video_id_regex})})
        return match['id'] if match.present? && match['id']

        # youtube.com/watch?v=id
        if uri.path.match(%r{^\/watch}).present?
          vid_id = CGI::parse(uri.query)
          return vid_id['v'].first if vid_id.present? && vid_id['v'].present?

        # youtube.com/oembed?url=http%3A//www.youtube.com/watch?v%3D-wtIMTCHWuI
        elsif uri.path.match(/^oembed/).present?
          vid_url = CGI.unescape(CGI::parse(uri.query)['url'])
          return Video::Youtube.new(vid_url).video_id
        end

      # youtu.be/id
      elsif uri.host.match(/youtu\.be$/).present?
        match = uri.path.match(%r{^\/(?<id>#{video_id_regex})})
        return match['id'] if match.present? && match['id'].present?
      end
    end

    def thumbnail_url
      "https://img.youtube.com/vi/#{video_id}/0.jpg"
    end

    private

    attr_reader :url

    def video_id_regex
      '[\-a-zA-Z0-9]+'
    end

    def uri
      @uri ||= URI.parse(url)
    end
  end
end
