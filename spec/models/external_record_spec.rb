require 'rails_helper'

RSpec.describe ExternalRecord, type: :model do
  context 'associations' do
    it { should belong_to :application }
    it { should belong_to :externalizable }
  end
end
