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

  describe 'self.map_move_action' do
    it 'should map move action strings with activity actions' do
      expect(Activity.map_move_action('move')).to eq :moved
      expect(Activity.map_move_action('link')).to eq :linked
      expect(Activity.map_move_action('duplicate')).to eq :duplicated
    end
  end
end
