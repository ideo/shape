FactoryBot.define do
  factory :network_invitation do
    token { SecureRandom.alphanumeric(12) }
    user nil
    organization nil
  end
end
