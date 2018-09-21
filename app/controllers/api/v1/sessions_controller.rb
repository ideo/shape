class Api::V1::SessionsController < Api::V1::BaseController
  skip_before_action :check_api_authentication!

  def destroy
    sign_out(current_user) if user_signed_in?
    render json: {}, status: 200
  end
end
