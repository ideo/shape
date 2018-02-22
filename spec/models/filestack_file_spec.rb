require 'rails_helper'

RSpec.describe FilestackFile, type: :model do
  context 'validations' do
    it { should validate_presence_of(:url) }
    it { should validate_presence_of(:handle) }
  end

  context 'associations' do
    it { should have_one :item }
  end
end
