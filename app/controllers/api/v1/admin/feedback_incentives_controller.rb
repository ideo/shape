class Api::V1::Admin::FeedbackIncentivesController < Api::V1::BaseController
  before_action :authorize_shape_admin!

  def index
    respond_to do |format|
      format.csv do
        send_data ExportPendingIncentives.call,
                  type: 'text/csv',
                  filename: "feedback-incentives-#{Time.now}.csv",
                  disposition: 'attachment'
      end
    end
  end

  def mark_all_paid
    SurveyResponse
      .incentive_owed
      .each(&:record_incentive_paid!)

    head :ok
  end
end
