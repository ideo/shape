require 'rails_helper'

describe Collection, type: :model do
  context 'associations' do
    it { should have_many :collection_cards }
    it { should have_many :reference_collection_cards }
    it { should have_many :items }
    it { should have_many :collections }
    it { should have_one :parent_collection_card }
    it { should belong_to :cloned_from }
    it { should belong_to :organization }
  end
end
