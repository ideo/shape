# == Schema Information
#
# Table name: audiences
#
#  id                 :bigint(8)        not null, primary key
#  criteria           :string
#  name               :string
#  price_per_response :decimal(10, 2)   default(0.0)
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#

class Audience < ApplicationRecord
  acts_as_taggable_on(
    :ages,
    :children_ages,
    :countries,
    :education_levels,
    :genders,
    :adopter_types,
    :interests,
    :publications
  )

  has_many :audience_organizations, dependent: :destroy
  has_many :organizations, through: :audience_organizations
  has_many :test_audiences, dependent: :destroy

  delegate :can_edit?,
           :can_view?,
           to: :organization,
           allow_nil: true

  def link_sharing?
    # NOTE: for now this logic should suffice, however we could eventually change it
    # to be more explicit, like a bool field on the model
    price_per_response.blank? || price_per_response.zero?
  end

  def all_tags
    # should we have this as a constant AND as a
    # convenience wrapper to access all at once as a hash of arrays?
  end
end
