# Just used as a convenient way to generate csv reports -- SuperAdmin only
class ReportsController < ApplicationController
  before_action :authenticate_super_admin!

  def show
    @report = nil
    if params[:id] == 'gci-user-report'
      @report = GciExport.user_report
    elsif params[:id] == 'gci-projects-report'
      @report = GciExport.projects_report
    elsif params[:id] == 'org-user-report'
      @report = OrganizationUserReport.all_user_counts
    end
    respond_to do |format|
      format.any { send_data @report, filename: "#{params[:id]}-#{Date.today}.csv" }
    end
  end
end
