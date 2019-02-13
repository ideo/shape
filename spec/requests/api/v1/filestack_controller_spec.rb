require 'rails_helper'

describe Api::V1::FilestackController, type: :request, json: true, auth: true do
  describe 'GET #token' do
    let(:path) { '/api/v1/filestack/token' }
    let(:security_token) do
      {
        policy: 'xyz',
        signature: 'zx123',
      }
    end

    it 'calls FilestackFile.security_token to get a new token' do
      expect(FilestackFile).to receive(:security_token).and_return(security_token)
      get(path)
      expect(response.status).to be 200
      expect(response.body).to eq(security_token.to_json)
    end
  end
end
