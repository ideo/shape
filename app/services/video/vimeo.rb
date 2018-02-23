module Video
  class Vimeo
    def initialize(url)
      @url = url
    end

    def valid_url?
      video_id.present?
    end

    def video_id
      return nil unless uri.host.match(/vimeo\.com/).present?

      match = uri.path.match(%r{^\/(?<id>[0-9]+)})

      return unless match.present?

      match['id']
    end

    def video_thumbnail_url
      "https://img.youtube.com/vi/#{video_id}/0.jpg"
    end

    private

    attr_reader :url

    def uri
      @uri ||= URI.parse(url)
    end
  end
end
