# == Schema Information
#
# Table name: applications
#
#  id             :bigint(8)        not null, primary key
#  email          :string
#  group_icon_url :string
#  invite_cta     :string
#  invite_url     :string
#  logo_url       :string
#  name           :string
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  user_id        :bigint(8)
#
# Indexes
#
#  index_applications_on_user_id  (user_id)
#

class Application < ApplicationRecord
  # 'Bot' user that acts on behalf of this application
  belongs_to :user

  has_many :api_tokens
  has_many :application_organizations
  has_many :organizations, through: :application_organizations
  has_many :external_records
  has_many :datasets

  before_validation :create_user, on: :create
  after_update :update_application_collection_names, if: :saved_change_to_name?
  after_commit :reindex_user, on: :create

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

  def reindex_user
    # So that they can be marked as application bot user in ElasticSearch
    user.reindex
  end
end
