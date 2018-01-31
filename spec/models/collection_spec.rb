require 'rails_helper'

describe Collection, type: :model do
  context 'associations' do
    it { should belong_to :cloned_from }
  end
end
