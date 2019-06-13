class Api::V1::Admin::FeedbackIncentivesController < Api::V1::BaseController
  before_action :authorize_shape_admin!
  after_action :mark_all_paid, only: :index

  def index
    respond_to do |format|
      format.csv do
        send_data PaidTests::ExportPendingIncentives.call,
                  type: 'text/csv',
                  filename: "feedback-incentives-#{Time.now}.csv",
                  disposition: 'attachment'
      end
    end
  end

  def mark_all_paid
    PaidTests::ExportPendingIncentives.mark_as_paid!
  end
end
