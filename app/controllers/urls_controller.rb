class UrlsController < ApplicationController
  # authenticate to prevent this method being used as a general proxy
  before_action :authenticate_user!

  def passthru
    url = params.require(:url)
    html = HTTParty.get(URI.encode(url))
    render html: html.response.body.html_safe
  end
end
