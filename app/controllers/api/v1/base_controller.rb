class Api::V1::BaseController < ApplicationController
  load_and_authorize_resource

  respond_to :json

  private

  def render_json(object)
    render json: object
  end

  def render_json_errors(errors)
    render json: { errors: errors },
           status: :unprocessable_entity
  end
end
