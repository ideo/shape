class Api::V1::SessionsController < Api::V1::BaseController
  skip_before_action :authenticate_user!

  def destroy
    sign_out(current_user) if user_signed_in?
    render json: {}, status: 200
  end
end
