class Application < ApplicationRecord
  # 'Bot' user that acts on behalf of this application
  belongs_to :user

  has_many :api_tokens
  has_many :application_organizations
  has_many :organizations, through: :application_organizations
  has_many :external_records

  before_validation :create_user, on: :create
  after_update :update_application_collection_names, if: :saved_change_to_name?

  private

  def create_user
    uid = SecureRandom.uuid
    self.user ||= User.create!(
      first_name: name,
      email: "#{uid}@shape.space",
      uid: uid,
      provider: 'shape',
      password: Devise.friendly_token(40),
      # set terms_accepted, otherwise will get 401 unauthorized
      terms_accepted: true,
    )
  end

  def update_application_collection_names
    application_organizations.map(&:root_collection).each do |collection|
      collection.update(name: name)
    end
  end
end
