class Api::V1::Admin::TestCollectionsController < Api::V1::BaseController
  before_action :authorize_shape_admin!

  def index
    collections =
      Collection::TestCollection.includes(paid_test_audiences: [:audience])
                                .joins(:paid_test_audiences)
                                .where(test_status: :live)
                                .order(test_launched_at: :desc)
                                .page(@page)
                                .per(25)

    headers['X-Total-Pages'] = collections.total_pages

    respond_to do |format|
      format.jsonapi do
        render jsonapi: collections,
               include: [test_audiences: [:audience]],
               class: {
                 'Collection::TestCollection': SerializableAdminTestCollection,
                 TestAudience: SerializableTestAudience,
                 Audience: SerializableAudience,
               }
      end
      format.csv do
        start_time = Time.parse(params[:start_date]).beginning_of_day if params[:start_date].present?
        start_time ||= Time.current.beginning_of_month.beginning_of_day
        end_time = start_time.end_of_month.end_of_day

        send_data PaidTests::FinanceExportForTimeframe.call(start_time: start_time, end_time: end_time),
                  type: 'text/csv',
                  filename: "paid-test-collections-#{start_time.to_date}-#{end_time.to_date}.csv",
                  disposition: 'attachment'
      end
    end
  end
end
