class UrlsController < ApplicationController
  # authenticate to prevent this method being used as a general proxy
  before_action :authenticate_user!

  def passthru
    html = HTTParty.get(params.require(:url))
    render html: html.response.body.html_safe
  end
end
