require 'rails_helper'

describe User, type: :model do
  context 'associations' do
    it { should have_many :organization_users }
    it { should have_many :organizations }
  end
end
