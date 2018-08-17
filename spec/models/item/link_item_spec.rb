require 'rails_helper'

RSpec.describe Item::LinkItem, type: :model do
  context 'validations' do
    it { should validate_presence_of(:url) }
  end
end
