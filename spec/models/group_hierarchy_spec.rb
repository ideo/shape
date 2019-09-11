require 'rails_helper'

RSpec.describe GroupHierarchy, type: :model do
  describe 'associations' do
    it { should belong_to :parent_group }
    it { should belong_to :granted_by }
    it { should belong_to :subgroup }
  end
end
