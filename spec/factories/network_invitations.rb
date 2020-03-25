FactoryBot.define do
  factory :network_invitation do
    token { SecureRandom.alphanumeric(12) }
    user nil
    organization factory: :organization_without_groups
  end
end
