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
