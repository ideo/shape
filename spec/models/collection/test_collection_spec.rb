require 'rails_helper'

describe Collection::TestCollection, type: :model do
  context 'associations' do
    it { should have_many :questions }
    it { should have_many :survey_responses }
  end
end
