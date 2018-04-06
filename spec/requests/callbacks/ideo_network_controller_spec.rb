require 'rails_helper'

describe 'Ideo Profile API Requests', json: true do
  describe 'POST #user' do
    let!(:user) { create(:user) }
    let(:uid) { user.uid }
    let(:user_data) do
      {
        uid: user.uid,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        picture: user.pic_url_square
      }
    end
    # These are the headers the request from profile.ideo.com will have
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
      ENV['IDEO_NETWORK_CALLBACK_SECRET'] = 'shared_secret_key_abc123'
    end

    context 'event: updated' do
      it 'returns a 200' do
        post(
          '/callbacks/ideo_network/users',
          params: { uid: uid, event: :updated, user: user_data }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(200)
      end

      it 'updates the user' do
        expect(user.first_name).not_to eq('Fancy')
        expect(user.last_name).not_to eq('Newname')
        expect(user.email).not_to eq('fancy@newname.com')
        expect(user.pic_url_square).not_to eq('newpic.jpg')

        post(
          '/callbacks/ideo_network/users',
          params: {
            uid: uid,
            event: :updated,
            user: {
              first_name: 'Fancy',
              last_name: 'Newname',
              email: 'fancy@newname.com',
              picture: 'newpic.jpg',
            }
          }.to_json,
          headers: valid_headers,
        )

        user.reload
        expect(user.first_name).to eq('Fancy')
        expect(user.last_name).to eq('Newname')
        expect(user.email).to eq('fancy@newname.com')
        expect(user.pic_url_square).to eq('newpic.jpg')
      end
    end

    context 'event: deleted' do
      it 'returns a 200' do
        post(
          '/callbacks/ideo_network/users',
          params: { uid: uid, event: :deleted }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(200)
      end

      it 'deletes the user' do
        expect(User.find_by_id(user.id)).to eq(user)

        post(
          '/callbacks/ideo_network/users',
          params: { uid: uid, event: :deleted }.to_json,
          headers: valid_headers,
        )

        expect(User.find_by_id(user.id)).to be_nil
      end

      it 'returns a 200 if user does not exist' do
        post(
          '/callbacks/ideo_network/users',
          params: { uid: 'FAKEID', event: :deleted }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(200)
      end
    end

    context 'unsupported event' do
      it 'returns a 400' do
        post(
          '/callbacks/ideo_network/users',
          params: { uid: uid, event: :transformed, user: user_data }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(400)
      end
    end

    context 'invalid auth secret' do
      let(:invalid_headers) {
        json_headers.merge(
          'Authorization': 'invalid_shared_secret'
        )
      }

      it 'returns a 401' do
        post(
          '/callbacks/ideo_network/users',
          params: { uid: uid, event: :updated, user: user_data }.to_json,
          headers: invalid_headers,
        )
        expect(response.status).to eq(401)
      end
    end
  end
end
