class ApiToken < ApplicationRecord
  belongs_to :application_organization, required: true
  belongs_to :created_by, class_name: 'User', required: true

  delegate :organization, to: :application_organization

  before_create :generate_token

  private

  def generate_token
    self.token = SecureRandom.hex(20)
    self.token = SecureRandom.hex(20) while ApiToken.where(token: token).count.positive?
  end
end
