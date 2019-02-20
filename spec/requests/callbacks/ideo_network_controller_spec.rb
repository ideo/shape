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

  describe 'POST #invoices' do
    describe 'unsupported invoice event' do
      it 'renders bad request' do
        post(
          '/callbacks/ideo_network/invoices',
          params: { event: 'invoice.something' }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(400)
      end
    end

    describe 'invoice.payment_failed event' do
      let!(:organization) { create(:organization) }
      let!(:application_organization) { { type: 'application_organizations', attributes: { external_id: organization.id } } }
      let!(:payment_method) { { type: 'payment_methods', id: 123 } }

      context 'missing parameters' do
        it 'can not find payment method, responds with bad request' do
          post(
            '/callbacks/ideo_network/invoices',
            params: { event: 'invoice.payment_failed', included: [application_organization] }.to_json,
            headers: valid_headers,
          )
          expect(response.status).to eq(400)
        end

        it 'can not find application organization, responds with bad request' do
          post(
            '/callbacks/ideo_network/invoices',
            params: { event: 'invoice.payment_failed', included: [payment_method] }.to_json,
            headers: valid_headers,
          )
          expect(response.status).to eq(400)
        end
      end

      context 'can not find organization' do
        it 'responds with not found' do
          post(
            '/callbacks/ideo_network/invoices',
            params: { event: 'invoice.payment_failed', included: [{ type: 'application_organizations', attributes: { external_id: nil } }, payment_method] }.to_json,
            headers: valid_headers,
          )
          expect(response.status).to eq(404)
        end
      end

      context 'everything found' do
        it 'notifies using a mailer' do
          mailer = double
          expect(mailer).to receive(:deliver_later)
          expect(InvoicePaymentFailedMailer).to receive(:notify).with(
            organization.id, payment_method[:id]
          ).and_return(mailer)
          post(
            '/callbacks/ideo_network/invoices',
            params: { event: 'invoice.payment_failed', included: [application_organization, payment_method] }.to_json,
            headers: valid_headers,
          )
        end

        it 'responds 200' do
          post(
            '/callbacks/ideo_network/invoices',
            params: { event: 'invoice.payment_failed', included: [application_organization, payment_method] }.to_json,
            headers: valid_headers,
          )
          expect(response.status).to eq(200)
        end
      end
    end
  end

  describe 'POST #payment_methods' do
    let!(:organization) { create(:organization) }
    describe 'unsupported invoice event' do
      it 'renders bad request' do
        post(
          '/callbacks/ideo_network/payment_methods',
          params: { event: 'payment_method.something' }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(400)
      end
    end

    describe 'payment_method.created' do
      it 'responds with bad request if the params are not valid' do
        post(
          '/callbacks/ideo_network/payment_methods',
          params: { event: 'payment_method.created' }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(400)
      end

      it 'responds with bad request if no application organization is found' do
        post(
          '/callbacks/ideo_network/payment_methods',
          params: { data: { relationships: { application_organizations: { relationships: { application_organization: { data: { id: 123 } } } } } }, event: 'payment_method.created' }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(400)
      end

      it 'responds with bad request if unable to find organization' do
        post(
          '/callbacks/ideo_network/payment_methods',
          params: { data: { relationships: { application_organizations: { relationships: { application_organization: { data: { id: 123 } } } } } }, included: [{ id: 123, type: 'application_organizations', attributes: { external_id: 234 } }], event: 'payment_method.created' }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(404)
      end

      it 'responds 200 with correct params' do
        allow(Organization).to receive(:find).with(organization.id).and_return(organization)
        expect(organization).to receive(:update_payment_status)
        post(
          '/callbacks/ideo_network/payment_methods',
          params: { data: { relationships: { application_organizations: { relationships: { application_organization: { data: { id: 123 } } } } } }, included: [{ id: 123, type: 'application_organizations', attributes: { external_id: organization.id } }], event: 'payment_method.created' }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(200)
      end
    end

    describe 'payment_method.expiring' do
      let!(:organization) { create(:organization) }
      let!(:application_organization) { { type: 'application_organizations', attributes: { external_id: organization.id } } }
      let!(:payment_method_id) { 123 }

      context 'can not find payment method id' do
        it 'renders bad request' do
          post(
            '/callbacks/ideo_network/payment_methods',
            params: { event: 'payment_method.expiring', included: [application_organization] }.to_json,
            headers: valid_headers,
          )
          expect(response.status).to eq(400)
        end
      end

      context 'can not find application organization' do
        it 'renders bad request' do
          post(
            '/callbacks/ideo_network/payment_methods',
            params: { event: 'payment_method.expiring', data: { attributes: { id: payment_method_id } }, included: [] }.to_json,
            headers: valid_headers,
          )
          expect(response.status).to eq(400)
        end
      end

      context 'can not find organization' do
        it 'renders not found' do
          application_organization[:attributes][:external_id] = 123
          post(
            '/callbacks/ideo_network/payment_methods',
            params: { event: 'payment_method.expiring', data: { attributes: { id: payment_method_id } }, included: [application_organization] }.to_json,
            headers: valid_headers,
          )
          expect(response.status).to eq(404)
        end
      end

      context 'everything found' do
        it 'notifies using a mailer' do
          mailer = double
          expect(mailer).to receive(:deliver_later)
          expect(PaymentMethodExpiringMailer).to receive(:notify).with(
            organization.id, payment_method_id
          ).and_return(mailer)
          post(
            '/callbacks/ideo_network/payment_methods',
            params: { event: 'payment_method.expiring', data: { attributes: { id: payment_method_id } }, included: [application_organization] }.to_json,
            headers: valid_headers,
          )
        end

        it 'responds 200' do
          post(
            '/callbacks/ideo_network/payment_methods',
            params: { event: 'payment_method.expiring', data: { attributes: { id: payment_method_id } }, included: [application_organization] }.to_json,
            headers: valid_headers,
          )
          expect(response.status).to eq(200)
        end
      end
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

      it 'archives the user' do
        expect(User.find_by_id(user.id)).to eq(user)

        post(
          '/callbacks/ideo_network/users',
          params: { uid: uid, data: { attributes: user_data }, event: :deleted }.to_json,
          headers: valid_headers,
        )

        expect(User.find_by_id(user.id).archived?).to be true
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
      it 'returns a 422' do
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
