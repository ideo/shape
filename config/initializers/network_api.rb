require 'network-api'

NetworkApi::Base.configure(
  url: URI.join('https', ENV['IDEO_SSO_HOST'], ENV['IDEO_SSO_API_PATH']).to_s,
  api_token: ENV['IDEO_SSO_API_TOKEN'],
  client_id: ENV['IDEO_SSO_CLIENT_ID']
)
