require 'rails_helper'

RSpec.describe Application, type: :model do
  describe 'callbacks' do
    describe '#create_user' do
      it 'creates a new user for the application' do
        expect {
          create(:application)
        }.to change(User, :count).by(1)
      end
    end
  end
end
