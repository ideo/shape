require 'rails_helper'

describe Organization, type: :model do
  context 'validations' do
    it { should validate_presence_of(:name) }
  end
  context 'associations' do
    it { should have_many :organization_users }
    it { should have_many :users }
  end
end
