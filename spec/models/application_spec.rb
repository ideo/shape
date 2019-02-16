require 'rails_helper'

RSpec.describe Application, type: :model do
  describe 'callbacks' do
    describe '#create_user' do
      let(:application) { create(:application) }

      it 'creates a new user for the application' do
        expect {
          application
        }.to change(User, :count).by(1)
      end

      it 'should set terms_accepted to true for the user' do
        expect(application.user.terms_accepted).to be true
      end
    end
  end
end
