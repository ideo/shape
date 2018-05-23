module HasActivities
  extend ActiveSupport::Concern

  included do
    has_many :activities,
             as: :target,
             class_name: 'Activity',
             dependent: :destroy
  end
end
