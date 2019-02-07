class Application < ApplicationRecord
  # 'Bot' user that acts on behalf of this application
  belongs_to :user

  has_many :api_tokens
  has_many :application_organizations
  has_many :organizations, through: :application_organizations
  has_many :external_records

  before_validation :create_user, on: :create

  private

  def create_user
    uid = SecureRandom.uuid
    self.user ||= User.create!(
      first_name: name,
      email: "#{uid}@shape.space",
      uid: uid,
      provider: 'shape',
      password: Devise.friendly_token(40),
    )
  end
end
