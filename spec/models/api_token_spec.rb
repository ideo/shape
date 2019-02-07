require 'rails_helper'

RSpec.describe ApiToken, type: :model do
  describe 'callbacks' do
    let!(:api_token) { create(:api_token) }

    it 'creates token' do
      expect(api_token.token).not_to be_nil
    end
  end
end
