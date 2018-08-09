require 'rails_helper'

RSpec.describe Activity, type: :model do
  context 'associations' do
    it { should belong_to :actor }
    it { should belong_to :target }
    it { should belong_to :organization }
    it { should have_many :activity_subjects }
    it { should have_many :subject_users }
    it { should have_many :subject_groups }
    it { should have_many :notifications }
  end
end
