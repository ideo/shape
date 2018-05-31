# This class is used to create Firebase a.k.a Google Auth user accounts,
# allowing us to generate auth tokens for those users
class GoogleAuthService
  GOOGLE_AUTH_URI = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/'.freeze
  JSON_HEADER = {
    'Content-Type': 'application/json',
  }.freeze

  attr_reader :access_token

  def initialize
    auth = ENV['GOOGLE_CLOUD_KEYFILE']
    credentials = Google::Auth::DefaultCredentials.make_creds(
      json_key_io: StringIO.new(auth),
      scope: %w[
        https://www.googleapis.com/auth/cloud-platform
        https://www.googleapis.com/auth/identitytoolkit
        https://www.googleapis.com/auth/firebase.database
        https://www.googleapis.com/auth/userinfo.email
      ],
    )
    credentials.apply!(JSON_HEADER.clone)
    @access_token = credentials.access_token
  end

  def self.client
    @client ||= new
  end

  def self.import_users(users = [])
    headers = JSON_HEADER.merge(
      authorization: "Bearer #{client.access_token}",
    )
    uri = GOOGLE_AUTH_URI + 'uploadAccount'
    user_data = users.map do |u|
      { localId: u.id, email: u.email }
    end
    body = { users: user_data }
    HTTParty.post(uri, body: body.to_json, headers: headers)
    # TODO: check success response, what happens if error?
  end

  # https://firebase.google.com/docs/auth/admin/create-custom-tokens
  def self.create_custom_token(uid)
    now_seconds = Time.now.to_i
    payload = {
      iss: google_cloud_credentials.client_email,
      sub: google_cloud_credentials.client_email,
      aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
      iat: now_seconds,
      exp: now_seconds + (60 * 60), # max expiration is 1 hour
      uid: uid,
    }
    JWT.encode payload, private_key, 'RS256'
  end

  def self.google_cloud_credentials
    Hashie::Mash.new(JSON.parse(ENV['GOOGLE_CLOUD_KEYFILE']))
  end

  def self.private_key
    OpenSSL::PKey::RSA.new google_cloud_credentials.private_key
  end
end
