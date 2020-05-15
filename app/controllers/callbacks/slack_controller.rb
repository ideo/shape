class Callbacks::SlackController < ActionController::Base
  def event
    if params[:event].present?
      # TODO: Slack wants us to do this in the background, and respond 200 OK immediately
      Slack::ProcessEventReceived.call(event: params[:event])
    end
    render plain: params[:challenge], status: :ok
  end
end
