class ApiToken < ApplicationRecord
  belongs_to :user, required: true
  belongs_to :created_by, class_name: 'User', required: true

  before_create :generate_token

  private

  def generate_token
    self.token = SecureRandom.hex(20)
    self.token = SecureRandom.hex(20) while ApiToken.where(token: token).count.positive?
  end
end
