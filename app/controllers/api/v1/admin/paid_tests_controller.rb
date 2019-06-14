class Api::V1::Admin::PaidTestsController < Api::V1::BaseController
  before_action :authorize_shape_admin!

  def finance_export
    # Expects parse-able date, e.g. "May 2019"
    start_time = Time.parse(params[:month]).beginning_of_day if params[:month].present?
    start_time ||= Time.current.beginning_of_month.beginning_of_day
    end_time = start_time.end_of_month.end_of_day
    data = PaidTests::FinanceExportForTimeframe.call(start_time: start_time, end_time: end_time)

    respond_to do |format|
      format.csv do
        send_data data,
                  type: 'text/csv',
                  filename: "finance-export-#{start_time.to_date}-to-#{end_time.to_date}.csv",
                  disposition: 'attachment'
      end
    end
  end

  def months_with_purchases
    months = PaidTests::FinanceExportForTimeframe.months_with_purchases
    months = ['July 2018', 'August 2018']
    render json: { months: months }
  end

  after_action :mark_all_tests_paid, only: :pending_incentives_export
  def pending_incentives_export
    respond_to do |format|
      format.csv do
        send_data PaidTests::ExportPendingIncentives.call,
                  type: 'text/csv',
                  filename: "feedback-incentives-#{Time.now}.csv",
                  disposition: 'attachment'
      end
    end
  end

  private

  def mark_all_tests_paid
    PaidTests::ExportPendingIncentives.mark_as_paid!
  end
end
