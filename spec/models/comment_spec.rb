require 'rails_helper'

RSpec.describe Comment, type: :model do
  context 'validations' do
    it { should validate_presence_of(:message) }
  end
  context 'associations' do
    it { should belong_to :comment_thread }
    it { should belong_to :author }
  end
end
