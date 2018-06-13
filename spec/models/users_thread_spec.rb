require 'rails_helper'

describe UsersThread, type: :model do
  context 'associations' do
    it { should belong_to :user }
    it { should belong_to :comment_thread }
  end
end
