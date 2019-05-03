class Audience < ApplicationRecord
  belongs_to :organization, optional: true

  delegate :can_edit?,
           :can_view?,
           to: :organization,
           allow_nil: true
end
