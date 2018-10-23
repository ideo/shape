class TestsController < ApplicationController
  include ApplicationHelper
  before_action :load_test_collection, only: %i[show]

  def show
  end

  private

  def load_test_collection
    @collection = Collection::TestCollection.find(params[:id])
    if @collection.collection_to_test
      redirect_to "#{frontend_url_for(@collection.collection_to_test)}?open=tests"
    end
  rescue ActiveRecord::RecordNotFound
    redirect_to root_url
  end
end
