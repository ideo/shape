require 'rails_helper'

RSpec.describe Comment, type: :model do
  context 'associations' do
    it { should belong_to :comment_thread }
    it { should belong_to :author }
  end
end
