require 'rails_helper'

RSpec.describe CommentThread, type: :model do
  context 'associations' do
    it { should belong_to :record }
    it { should have_many :comments }
  end
end
