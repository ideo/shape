require 'net/http'

class UrlExists
  def initialize(url)
    @url = url
  end

  def call
    uri = URI.parse(@url)
    return false if uri.host.blank? || uri.request_uri.blank?
    begin
      Net::HTTP.start(uri.host, uri.port) do |http|
        response_code = http.head(uri.request_uri).code
        return success_codes.include?(response_code)
      end
    rescue
      false
    end
    false
  end

  private

  def success_codes
    ['200', '304']
  end
end
