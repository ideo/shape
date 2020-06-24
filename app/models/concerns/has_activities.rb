module HasActivities
  extend ActiveSupport::Concern

  included do
    has_many :activities,
             as: :target,
             class_name: 'Activity',
             dependent: :destroy
  end

  def cache_activity_count!
    return unless respond_to?(:cached_activity_count)

    cache_attribute!(
      :cached_activity_count,
      activities.count,
      touch: false,
    )
  end
end
