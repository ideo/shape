class Callbacks::SlackController < ActionController::Base
  def event
    Slack::ProcessEventReceived.call(event: params[:event]) if params[:event].present?
    render plain: params[:challenge], status: :ok
  end
end
