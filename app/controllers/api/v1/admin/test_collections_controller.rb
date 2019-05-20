class Api::V1::Admin::TestCollectionsController < Api::V1::BaseController
  before_action :authorize_shape_admin!

  def index
    render jsonapi: Collection::TestCollection.includes(test_audiences: [:audience]).all,
      include: [test_audiences: [:audience]],
      class: {
        'Collection::TestCollection': SerializableAdminTestCollection,
        TestAudience: SerializableTestAudience,
        Audience: SerializableAudience,
      }
  end
end