require 'rails_helper'

RSpec.describe Item::VideoItem, type: :model do
  context 'validations' do
    it { should validate_presence_of(:url) }
    it { should validate_presence_of(:thumbnail_url) }
  end
end
