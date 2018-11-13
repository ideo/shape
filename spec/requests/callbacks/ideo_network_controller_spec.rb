require 'rails_helper'

describe 'Ideo Profile API Requests' do
  let(:json_headers) do
    {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  end
  let(:valid_headers) do
    json_headers.merge(
      'Authorization': 'shared_secret_key_abc123',
    )
  end

  before do
    ENV['IDEO_SSO_CLIENT_SECRET'] = 'shared_secret_key_abc123'
  end

  describe 'POST #payment_methods' do
    it 'responds with bad request if the params are not valid' do
      post(
        '/callbacks/ideo_network/payment_methods',
        params: {}.to_json,
        headers: valid_headers,
      )
      expect(response.status).to eq(400)
    end

    it 'responds with bad request if no application organization is found' do
      post(
        '/callbacks/ideo_network/payment_methods',
        params: { data: { relationships: { application_organizations: { relationships: { application_organization: { data: { id: 123 } } } } } } }.to_json,
        headers: valid_headers,
      )
      expect(response.status).to eq(400)
    end

    it 'responds with bad request if application organization has no organization_id' do
      post(
        '/callbacks/ideo_network/payment_methods',
        params: { data: { relationships: { application_organizations: { relationships: { application_organization: { data: { id: 123 } } } } } }, included: [{ id: 123, type: 'application_organizations' }] }.to_json,
        headers: valid_headers,
      )
      expect(response.status).to eq(400)
    end

    it 'responds with bad request if unable to find organization' do
      post(
        '/callbacks/ideo_network/payment_methods',
        params: { data: { relationships: { application_organizations: { relationships: { application_organization: { data: { id: 123 } } } } } }, included: [{ id: 123, type: 'application_organizations', attributes: { external_id: 234 } }] }.to_json,
        headers: valid_headers,
      )
      expect(response.status).to eq(404)
    end

    it 'responds 200 with correct params' do
      organization = create(:organization)
      allow(Organization).to receive(:find).with(organization.id).and_return(organization)
      expect(organization).to receive(:update_payment_status)
      post(
        '/callbacks/ideo_network/payment_methods',
        params: { data: { relationships: { application_organizations: { relationships: { application_organization: { data: { id: 123 } } } } } }, included: [{ id: 123, type: 'application_organizations', attributes: { external_id: organization.id } }] }.to_json,
        headers: valid_headers,
      )
      expect(response.status).to eq(200)
    end
  end

  describe 'POST #user' do
    let!(:user) { create(:user) }
    let(:uid) { user.uid }
    let(:user_data) do
      {
        uid: user.uid,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        picture: user.picture,
      }
    end

    context 'event: updated' do
      it 'returns a 200' do
        post(
          '/callbacks/ideo_network/users',
          params: { uid: uid, event: :updated, data: { attributes: user_data } }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(200)
      end

      it 'updates the user' do
        expect(user.first_name).not_to eq('Fancy')
        expect(user.last_name).not_to eq('Newname')
        expect(user.email).not_to eq('fancy@newname.com')
        expect(user.picture).not_to eq('newpic.jpg')

        post(
          '/callbacks/ideo_network/users',
          params: {
            uid: uid,
            event: :updated,
            data: {
              attributes: {
                uid: uid,
                first_name: 'Fancy',
                last_name: 'Newname',
                email: 'fancy@newname.com',
                picture: 'newpic.jpg',
              },
            },
          }.to_json,
          headers: valid_headers,
        )

        user.reload
        expect(user.first_name).to eq('Fancy')
        expect(user.last_name).to eq('Newname')
        expect(user.email).to eq('fancy@newname.com')
        expect(user.picture).to eq('newpic.jpg')
      end
    end

    context 'event: deleted' do
      it 'returns a 200' do
        post(
          '/callbacks/ideo_network/users',
          params: { uid: uid, data: { attributes: user_data }, event: :deleted }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(200)
      end

      it 'deletes the user' do
        expect(User.find_by_id(user.id)).to eq(user)

        post(
          '/callbacks/ideo_network/users',
          params: { uid: uid, data: { attributes: user_data }, event: :deleted }.to_json,
          headers: valid_headers,
        )

        expect(User.find_by_id(user.id)).to be_nil
      end

      it 'returns a 200 if user does not exist' do
        post(
          '/callbacks/ideo_network/users',
          params: { uid: 'FAKEID', data: { attributes: { uid: 'FAKEID' } }, event: :deleted }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(200)
      end
    end

    context 'unsupported event' do
      it 'returns a 400' do
        post(
          '/callbacks/ideo_network/users',
          params: { uid: uid, event: :transformed, data: { attributes: user_data } }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(400)
      end
    end

    context 'invalid auth secret' do
      let(:invalid_headers) {
        json_headers.merge(
          'Authorization': 'invalid_shared_secret',
        )
      }

      it 'returns a 401' do
        post(
          '/callbacks/ideo_network/users',
          params: { uid: uid, event: :updated, data: { attributes: user_data } }.to_json,
          headers: invalid_headers,
        )
        expect(response.status).to eq(401)
      end
    end
  end
end
