class Api::V1::Admin::TestCollectionsController < Api::V1::BaseController
  before_action :authorize_shape_admin!

  def index
    render jsonapi: Collection::TestCollection.all,
      include: [:test_audiences],
      class: {
        'Collection::TestCollection': SerializableAdminTestCollection,
        TestAudience: SerializableTestAudience,
      }
  end
end