class TestsController < ApplicationController
  include ApplicationHelper
  before_action :load_test_collection, only: %i[show]

  def show
  end

  def completed
    # just to give it something to render
    @collection = Collection::TestCollection.new
    render 'show'
  end

  private

  def load_test_collection
    @collection = Collection::TestCollection.find(params[:id])
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
  rescue ActiveRecord::RecordNotFound
    redirect_to root_url
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
