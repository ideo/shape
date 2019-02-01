class Application < ApplicationRecord
  has_many :application_organizations
  has_many :organizations, through: :application_organizations
  has_many :api_tokens, through: :application_organizations
end
