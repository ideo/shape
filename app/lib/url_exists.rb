require 'net/http'

class UrlExists
  def initialize(url)
    @url = url
  end

  def call
    success_codes.include?(get_url_code)
  end

  private

  def get_url_code
    # After tons of issues with net/http,
    # HTTParty is much more reliable
    response = HTTParty.get(@url)
    response.code
  end

  def success_codes
    [200, 304]
  end
end
