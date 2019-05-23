# == Schema Information
#
# Table name: audiences
#
#  id                 :bigint(8)        not null, primary key
#  criteria           :string
#  name               :string
#  price_per_response :float
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#

class Audience < ApplicationRecord
  has_many :audience_organizations, dependent: :destroy
  has_many :organizations, through: :audience_organizations

  delegate :can_edit?,
           :can_view?,
           to: :organization,
           allow_nil: true

  TARGETED_PRICE_PER_RESPONSE = 4.75

  def link_sharing?
    # NOTE: for now this logic should suffice, however we could eventually change it
    # to be more explicit, like a bool field on the model
    price_per_response.blank? || price_per_response.zero?
  end
end
