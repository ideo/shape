require 'rails_helper'

describe GroupsThread, type: :model do
  context 'associations' do
    it { should belong_to :group }
    it { should belong_to :comment_thread }
  end
end
