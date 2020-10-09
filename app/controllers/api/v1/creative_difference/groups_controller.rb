class Api::V1::CreativeDifference::GroupsController < Api::V1::CreativeDifference::BaseController
  def index

    ids = params[:business_unit_ids].map do |id|
      ["Admins", "Members"].map do |user_type|
        "BusinessUnit_#{id}_#{user_type}"
      end
    end.flatten
    puts ids
    p groups = Group.where_external_id(ids, application_id: @current_application.id)
    # groups_by_id = {}
    render jsonapi: groups
  end
end
