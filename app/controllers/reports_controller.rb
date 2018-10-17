# Just used as a convenient way to generate GCI reports rather than having to do it in the console
class ReportsController < ApplicationController
  before_action :authenticate_super_admin!

  def show
    @report = nil
    if params[:id] == 'gci-user-report'
      @report = GciExport.user_report
    elsif params[:id] == 'gci-projects-report'
      @report = GciExport.projects_report
    end
    respond_to do |format|
      format.any { send_data @report, filename: "#{params[:id]}-#{Date.today}.csv" }
    end
  end
end
