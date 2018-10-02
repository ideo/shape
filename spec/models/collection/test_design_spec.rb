require 'rails_helper'

describe Collection::TestDesign, type: :model do
  context 'associations' do
    it { should belong_to :test_collection }
    it { should have_many :question_items }
  end
end
