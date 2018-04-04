require 'rails_helper'

describe Api::V1::SessionsController, type: :request, auth: true do
  let(:user) { @user }

  describe 'DELETE #destroy' do
    let(:path) { "/api/v1/sessions" }

    it 'returns a 200' do
      delete(path)
      expect(response.status).to eq(200)
    end

    it 'user is logged out' do
      delete(path)
      # The users/me request spec asserts it is assigned
      expect(assigns(:current_user)).to be nil
    end

    context 'logged-out user' do
      before do
        logout(:user)
      end

      it 'returns 200' do
        delete(path)
        expect(response.status).to eq(200)
      end
    end
  end
end
