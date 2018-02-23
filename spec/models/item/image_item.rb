require 'rails_helper'

RSpec.describe Item::ImageItem, type: :model do
  context 'validations' do
    it { should validate_presence_of(:filestack_file) }
  end
end
