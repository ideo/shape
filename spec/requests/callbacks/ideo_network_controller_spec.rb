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
            params: {
              event: 'invoice.payment_failed',
              included: [{
                type: 'application_organizations',
                attributes: { external_id: nil },
              },
                         payment_method],
            }.to_json,
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
            params: {
              event: 'invoice.payment_failed',
              included: [application_organization, payment_method],
            }.to_json,
            headers: valid_headers,
          )
        end

        it 'responds 200' do
          post(
            '/callbacks/ideo_network/invoices',
            params: {
              event: 'invoice.payment_failed',
              included: [application_organization, payment_method],
            }.to_json,
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
          params: {
            data: {
              relationships: {
                application_organizations: {
                  relationships: {
                    application_organization: {
                      data: { id: 123 },
                    },
                  },
                },
              },
            },
            event: 'payment_method.created',
          }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(400)
      end

      it 'responds with bad request if unable to find organization' do
        post(
          '/callbacks/ideo_network/payment_methods',
          params: {
            data: {
              relationships: {
                application_organizations: {
                  relationships: {
                    application_organization: {
                      data: {
                        id: 123,
                      },
                    },
                  },
                },
              },
            },
            included: [{
              id: 123, type: 'application_organizations',
              attributes: { external_id: 234 }
            }],
            event: 'payment_method.created',
          }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(404)
      end

      it 'responds 200 with correct params' do
        allow(Organization).to receive(:find).with(organization.id).and_return(organization)
        expect(organization).to receive(:update_payment_status)
        post(
          '/callbacks/ideo_network/payment_methods',
          params: {
            data: {
              relationships: {
                application_organizations: {
                  relationships: {
                    application_organization: {
                      data: {
                        id: 123,
                      },
                    },
                  },
                },
              },
            },
            included: [{
              id: 123,
              type: 'application_organizations',
              attributes: { external_id: organization.id },
            }],
            event: 'payment_method.created',
          }.to_json,
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
            params: {
              event: 'payment_method.expiring',
              data: { attributes: { id: payment_method_id } },
              included: [application_organization],
            }.to_json,
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
            params: {
              event: 'payment_method.expiring',
              data: { attributes: { id: payment_method_id } },
              included: [application_organization],
            }.to_json,
            headers: valid_headers,
          )
        end

        it 'responds 200' do
          post(
            '/callbacks/ideo_network/payment_methods',
            params: {
              event: 'payment_method.expiring',
              data: { attributes: { id: payment_method_id } },
              included: [application_organization],
            }.to_json,
            headers: valid_headers,
          )
          expect(response.status).to eq(200)
        end
      end
    end
  end

  describe 'POST #users' do
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

    context 'event: created' do
      let(:user) { build(:user) }
      let(:params) do
        {
          uid: uid,
          event: :created,
          data: {
            attributes: {
              uid: uid,
              first_name: 'Fancy',
              last_name: 'Newname',
              email: 'fancy@newname.com',
              picture: 'newpic.jpg',
            },
          },
        }.to_json
      end

      it 'returns a 200' do
        post(
          '/callbacks/ideo_network/users',
          params: params,
          headers: valid_headers,
        )
        expect(response.status).to eq(200)
      end

      it 'creates the user' do
        expect(user.persisted?).to be false
        expect do
          post(
            '/callbacks/ideo_network/users',
            params: params,
            headers: valid_headers,
          )
        end.to change(User, :count).by(1)
        user = User.last
        expect(user.persisted?).to be true
        # sets status to pending
        expect(user.pending?).to be true
        expect(user.uid).to eq uid
        expect(user.first_name).to eq('Fancy')
        expect(user.last_name).to eq('Newname')
        expect(user.email).to eq('fancy@newname.com')
        expect(user.picture).to eq('newpic.jpg')
      end

      context 'with existing user' do
        let!(:user) { create(:user) }

        it 'does not create a new one' do
          expect do
            post(
              '/callbacks/ideo_network/users',
              params: params,
              headers: valid_headers,
            )
          end.not_to change(User, :count)
        end
      end
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
        expect(user.active?).to be true
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
      let(:invalid_headers) do
        json_headers.merge(
          'Authorization': 'invalid_shared_secret',
        )
      end

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

  describe 'POST #groups' do
    let(:group_network_id) { SecureRandom.hex(15) }
    let!(:organization) { create(:organization) }
    let(:group_data) do
      {
        id: group_network_id,
        uid: SecureRandom.hex(15),
        name: 'group name',
        organization_id: SecureRandom.hex,
        admin_ids: [],
        member_ids: [],
      }
    end

    context 'event: created' do
      context 'with an organization' do
        let(:organization_data) do
          {
            id: SecureRandom.hex,
            type: 'organizations',
            attributes: {
              external_id: organization.id,
            },
          }
        end

        before do
          post(
            '/callbacks/ideo_network/groups',
            params: {
              id: group_network_id,
              event: 'group.created',
              data: { attributes: group_data },
              included: [organization_data],
            }.to_json,
            headers: valid_headers,
          )
        end

        it 'returns a 200' do
          expect(response.status).to eq(200)
        end

        it 'creates the group' do
          created_group = Group.last
          expect(created_group.name).to eq(group_data[:name])
          expect(created_group.network_id).to eq(group_network_id)
          expect(created_group.organization_id).to eq(organization.id)
        end
      end

      context 'without an organization' do
        let(:create_group) do
          post(
            '/callbacks/ideo_network/groups',
            params: { id: group_network_id, event: 'group.created', data: { attributes: group_data } }.to_json,
            headers: valid_headers,
          )
        end
        before do
          group_data.delete(:organization_id)
        end

        it 'returns a 200' do
          create_group
          expect(response.status).to eq(200)
        end

        it 'creates the group without an org' do
          expect { create_group }.to change(Group, :count).by(1)
          last_group = Group.last
          expect(last_group.name).to eq(group_data[:name])
          expect(last_group.organization).to be nil
        end
      end
    end

    context 'event: deleted' do
      let!(:group) { create(:group, network_id: group_network_id) }

      before do
        post(
          '/callbacks/ideo_network/groups',
          params: { id: group_network_id, event: 'group.deleted', data: { attributes: group_data } }.to_json,
          headers: valid_headers,
        )
      end

      it 'returns a 200' do
        expect(response.status).to eq(200)
      end

      it 'archives the group' do
        group.reload
        expect(group.archived).to be true
      end
    end

    context 'event: updated' do
      let!(:group) { create(:group, network_id: group_network_id) }
      it 'returns a 200' do
        post(
          '/callbacks/ideo_network/groups',
          params: { id: group_network_id, event: 'group.updated', data: { attributes: group_data } }.to_json,
          headers: valid_headers,
        )
        expect(response.status).to eq(200)
      end

      it 'updates the group' do
        expect(group.name).not_to eq('Fancy')

        post(
          '/callbacks/ideo_network/groups',
          params: {
            id: group_network_id,
            event: 'group.updated',
            data: {
              attributes: {
                id: group_network_id,
                name: 'Fancy',
              },
            },
          }.to_json,
          headers: valid_headers,
        )

        group.reload
        expect(group.name).to eq('Fancy')
      end
    end
  end

  describe 'POST #users_role' do
    let(:user) { create(:user) }
    let!(:group) { create(:group) }
    let(:users_role_id) { SecureRandom.hex }
    let(:role_data) do
      {
        id: SecureRandom.hex,
        type: 'roles',
        attributes: {
          name: 'member',
          resource_id: group.network_id,
          resource_type: 'Group',
        },
      }
    end

    let(:users_role_data) do
      {
        id: users_role_id,
        name: 'member',
        user_id: user.id,
        user_uid: user.uid,
      }
    end

    context 'event: created' do
      let(:included) { [role_data] }
      let(:params) do
        { id: users_role_id, event: 'users_role.created', data: { attributes: users_role_data }, included: included }.to_json
      end

      context 'with included role data' do
        before do
          post(
            '/callbacks/ideo_network/users_roles',
            params: params,
            headers: valid_headers,
          )
        end

        it 'returns a 200' do
          expect(response.status).to eq(200)
        end

        it 'assigns the new role' do
          expect(user.has_role?(:member, group)).to be true
        end
      end

      context 'with included role and user data' do
        let(:user) { build(:user) }
        let(:user_data) do
          {
            id: SecureRandom.hex,
            type: 'users',
            attributes: {
              uid: user.uid,
              first_name: 'Fancy',
              last_name: 'Newname',
              email: 'fancy@newname.com',
              picture: 'newpic.jpg',
            },
          }
        end
        let(:included) { [role_data, user_data] }

        it 'creates the new user and assigns the new role' do
          expect do
            post(
              '/callbacks/ideo_network/users_roles',
              params: params,
              headers: valid_headers,
            )
          end.to change(User, :count).by(1)
          user = User.last
          expect(user.has_role?(:member, group)).to be true
          expect(user.uid).to eq user_data[:attributes][:uid]
        end
      end
    end

    context 'event: deleted' do
      before do
        user.add_role(:member, group)
        post(
          '/callbacks/ideo_network/users_roles',
          params: { id: users_role_id, event: 'users_role.deleted', data: { attributes: users_role_data }, included: [role_data] }.to_json,
          headers: valid_headers,
        )
      end

      it 'returns a 200' do
        expect(response.status).to eq(200)
      end

      it 'unassigns the role' do
        expect(user.reload.has_role?(:member, group)).to be false
      end
    end
  end
end
