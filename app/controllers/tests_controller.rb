class TestsController < ApplicationController
  include ApplicationHelper
  include IdeoSsoHelper
  before_action :load_test_collection, only: %i[show token_auth]
  before_action :redirect_to_test, only: %i[show]

  def show
  end

  def completed
    # just to give it something to render
    @collection = Collection::TestCollection.new
    render 'show'
  end

  def token_auth
    url = test_url(@collection)
    if user_signed_in?
      redirect_to url
    else
      store_location_for :user, url
      redirect_to ideo_sso_token_auth_url(params[:token])
    end
  end

  private

  def load_test_collection
    @collection = Collection::TestCollection.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to root_url
  end

  def redirect_to_test
    if @collection.submission_box_template_test?
      redirect_to_submission_box_test
    elsif @collection.collection_to_test.present?
      redirect_to_collection_to_test(@collection.collection_to_test)
    elsif @collection.submission_test?
      @next_submission_test = @collection
                              .parent_submission_box
                              .random_next_submission_test(
                                for_user: current_user,
                                omit_id: @collection.id,
                              )
    end
  end

  def redirect_to_collection_to_test(collection_to_test)
    redirect_to "#{frontend_url_for(collection_to_test)}?open=tests"
  end

  def redirect_to_submission_box_test
    # first we have to determine if any tests are available for the user
    next_test = @collection.parent_submission_box.random_next_submission_test(for_user: current_user)
    if next_test.present?
      # then it depends if it's an in-collection test, or standalone
      if next_test.collection_to_test.present?
        redirect_to_collection_to_test(next_test.collection_to_test)
        return
      end
      redirect_to "/tests/#{next_test.id}"
      return
    end
    # no tests available
    if @collection.collection_to_test.present?
      redirect_to "#{frontend_url_for(@collection.parent_submission_box)}?testing_completed=true"
      return
    end
    # standalone page
    redirect_to '/tests/completed'
  end
end
