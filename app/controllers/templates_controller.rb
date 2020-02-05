class TemplatesController < ApplicationController
  include ApplicationHelper
  # authenticate will store the path and make sure the user returns to it once they log in
  before_action :authenticate_user!
  before_action :load_and_authorize_collection_template, only: %i[use_in_my_collection]

  def use_in_my_collection
    if current_user.current_organization.blank?
      session[:use_template_id] = params[:id]
      redirect_to root_path
      return
    end

    builder = CollectionTemplateBuilder.new(
      parent: current_user.current_user_collection,
      template: @template_collection,
      placement: 'end',
      created_by: current_user,
    )
    if builder.call
      # redirect to the newly created instance
      redirect_to frontend_url_for(builder.collection)
    else
      # error?
      redirect_to root_path
    end
  end

  private

  def load_and_authorize_collection_template
    # clear this out
    session[:use_template_id] = nil
    @template_collection = Collection.find(params[:id])
    unless @template_collection.master_template?
      redirect_to root_path
    end
    return if @template_collection.common_viewable? || current_ability.can?(:read, @template_collection)

    redirect_to root_path
  end
end
