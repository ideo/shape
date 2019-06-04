class Api::V1::Admin::TestCollectionsController < Api::V1::BaseController
  before_action :authorize_shape_admin!

  def index
    collections =
      Collection::TestCollection.includes(paid_test_audiences: [:audience])
                                .joins(:paid_test_audiences)
                                .where(test_status: :live)
                                .order(test_launched_at: :desc)
                                .page(@page)
                                .per(25)

    headers['X-Total-Pages'] = collections.total_pages

    render jsonapi: collections,
           include: [test_audiences: [:audience]],
           class: {
             'Collection::TestCollection': SerializableAdminTestCollection,
             TestAudience: SerializableTestAudience,
             Audience: SerializableAudience,
           }
  end
end
