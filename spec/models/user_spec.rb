require 'rails_helper'

describe User, type: :model do
  context 'associations' do
    it { should have_many :organization_users }
    it { should have_many :organizations }
  end

  context 'validations' do
    it { should validate_presence_of(:uid) }
    it { should validate_presence_of(:provider) }
    it { should validate_presence_of(:email) }
  end
end
