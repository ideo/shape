class Audience < ApplicationRecord
  belongs_to :organization, optional: true

  delegate :can_edit?,
           :can_view?,
           to: :organization,
           allow_nil: true

  def link_sharing?
    # NOTE: for now this logic should suffice, however we could eventually change it
    # to be more explicit, like a bool field on the model
    price_per_response.blank? || price_per_response.zero?
  end
end
