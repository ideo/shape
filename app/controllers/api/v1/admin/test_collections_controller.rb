class Api::V1::Admin::TestCollectionsController < Api::V1::BaseController
  before_action :authorize_shape_admin!

  def index
    collections = Collection::TestCollection.includes(test_audiences: [:audience])
      .where(test_status: :live)
      .where.not(test_audiences: { id: nil })

    render jsonapi: collections,
      include: [test_audiences: [:audience]],
      class: {
        'Collection::TestCollection': SerializableAdminTestCollection,
        TestAudience: SerializableTestAudience,
        Audience: SerializableAudience,
      }
  end
end