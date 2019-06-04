# == Schema Information
#
# Table name: api_tokens
#
#  id              :bigint(8)        not null, primary key
#  token           :text
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  application_id  :bigint(8)
#  created_by_id   :bigint(8)
#  organization_id :bigint(8)
#
# Indexes
#
#  index_api_tokens_on_app_id_org_id  (application_id,organization_id)
#  index_api_tokens_on_token          (token)
#

class ApiToken < ApplicationRecord
  belongs_to :application, required: false
  belongs_to :organization, required: false
  belongs_to :created_by, class_name: 'User', required: false

  validate :application_or_organization_present

  delegate :user,
           to: :application,
           prefix: true,
           allow_nil: true

  before_create :generate_token

  private

  def application_or_organization_present
    return if application.present? || organization.present?
    errors.add(:base, 'Application or organization must be present')
  end

  def generate_token
    self.token = SecureRandom.hex(20)
    self.token = SecureRandom.hex(20) while ApiToken.where(token: token).count.positive?
  end
end
