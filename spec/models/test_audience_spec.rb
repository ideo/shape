require 'rails_helper'

RSpec.describe TestAudience, type: :model do
  pending "add some examples to (or delete) #{__FILE__}"
  context 'associations' do
    it { should belong_to :audience }
    it { should belong_to :test_collection }
  end
end
