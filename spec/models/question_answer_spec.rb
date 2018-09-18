require 'rails_helper'

RSpec.describe QuestionAnswer, type: :model do
  context 'associations' do
    it { should belong_to(:survey_response) }
    it { should belong_to(:question) }
  end
end
