class Api::V1::FilestackController < Api::V1::BaseController
  # you have to be authenticated to get this token
  def token
    # default it will expire in one hour
    render json: FilestackFile.security_token
  end
end
