class Api::V1::CreativeDifference::BaseController < Api::V1::BaseController
  before_action :set_current_application

  private

  def set_current_application
    # set C∆ as current application
    @current_application = Application.find(1)
  end
end
