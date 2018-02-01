require 'rails_helper'

describe OrganizationUser, type: :model do
  context 'associations' do
    it { should belong_to :organization }
    it { should belong_to :user }
  end
end
