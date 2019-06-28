class Api::V1::Admin::BaseController < Api::V1::BaseController
  before_action :authorize_shape_admin!
end
