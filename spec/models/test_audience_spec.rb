require 'rails_helper'

describe TestAudience, type: :model do
  context 'associations' do
    it { should belong_to :audience }
    it { should belong_to :test_collection }
  end
end
