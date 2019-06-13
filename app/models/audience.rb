# == Schema Information
#
# Table name: audiences
#
#  id                 :bigint(8)        not null, primary key
#  criteria           :string
#  global_default     :integer
#  name               :string
#  price_per_response :decimal(10, 2)   default(0.0)
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
# Indexes
#
#  index_audiences_on_global_default  (global_default)
#

class Audience < ApplicationRecord
  acts_as_taggable

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
end
