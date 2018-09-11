class TestsController < ApplicationController
  before_action :load_test_collection, only: %i[show]

  def show
  end

  private

  def load_test_collection
    @collection = Collection::TestCollection.find(params[:id])
    # TODO: reject if this collection is not "live/public"
  end
end
