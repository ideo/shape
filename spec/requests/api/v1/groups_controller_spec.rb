require 'rails_helper'

describe Api::V1::GroupsController, type: :request, json: true, auth: true do
  let(:user) { @user }

  describe 'GET #index' do
    context 'with logged in user', create_org: true do
      let(:organization) { user.current_organization }
      let(:path) { "/api/v1/organizations/#{organization.id}/groups" }
      let!(:groups) do
        create_list(:group, 2, organization: organization, add_members: [user])
      end
      let!(:other_org) { create(:organization, member: user) }
      let!(:other_group) { create(:group, organization: other_org) }

      it 'returns the current org groups for the current user' do
        get(path)
        expect(response.status).to eq 200
        # the 2 groups we created + org members + org admins
        expect(json['data'].count).to eq 4
        found_ids = json['data'].map { |i| i['id'] }
        expect(found_ids).to include(groups.first.id.to_s)
        expect(found_ids).not_to include(other_group.id.to_s)
      end
    end

    context 'with api token and external_id', auth: false, api_token: true do
      let!(:application_org) do
        create(
          :application_organization,
          application: @api_token.application,
        )
      end
      let!(:group) { create(:group, organization: application_org.organization) }
      let!(:external_record) do
        create(
          :external_record,
          external_id: '99',
          externalizable: group,
          application: @api_token.application,
        )
      end
      let(:path) { '/api/v1/groups' }

      it 'returns the group with external_id' do
        get(
          path,
          params: { filter: { external_id: '99' } },
          headers: { Authorization: "Bearer #{@api_token.token}" },
        )
        expect(response.status).to eq(200)
        expect(json['data'].count).to eq 1
        expect(json['data'].first['attributes']['external_id']).to eq '99'
      end
    end
  end

  describe 'GET #show' do
    let!(:organization) { create(:organization) }
    let!(:group) { create(:group, add_admins: [user]) }
    let(:path) { "/api/v1/groups/#{group.id}" }
    let(:users_json) { json_included_objects_of_type('users') }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      get(path)
      expect(json['data']['attributes']).to match_json_schema('group')
    end

    it 'includes the role' do
      get(path)
      role_id = group.roles.first.id
      expect(json['data']['relationships']['roles']['data'][0]['id'].to_i).to eq(role_id)
    end

    it 'includes admin' do
      get(path)
      expect(users_json.map { |user| user['id'].to_i }).to match_array(*user.id)
      expect(users_json.first['attributes']).to match_json_schema('user')
    end

    context 'with member' do
      let!(:member) { create(:user) }

      before do
        member.add_role(Role::MEMBER, group)
      end

      it 'includes member and admin' do
        get(path)
        expect(users_json.map { |user| user['id'].to_i }).to match_array([user.id, member.id])
      end
    end
  end

  describe 'POST #create', create_org: true do
    let!(:group) { create(:group, add_admins: [user]) }
    let(:current_user) { user }
    let(:path) { '/api/v1/groups' }
    let(:params) do
      json_api_params(
        'groups',
        name: 'Creative Collaborators',
        tag: 'collaborators',
      )
    end

    context 'without org admin access' do
      before do
        user.remove_role(Role::ADMIN, user.current_organization.primary_group)
      end

      it 'returns a 401 if user is not an org admin' do
        post(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'with org admin access' do
      before do
        user.add_role(Role::ADMIN, user.current_organization.primary_group)
      end

      it 'returns a 200' do
        post(path, params: params)
        expect(response.status).to eq(200)
      end

      it 'creates new group' do
        expect { post(path, params: params) }.to change(Group, :count).by(1)
      end

      it 'adds the current user as an admin to the group' do
        post(path, params: params)
        group = Group.find(json['data']['id'])
        expect(group.admins[:users]).to match_array([current_user])
      end

      it 'matches JSON schema' do
        post(path, params: params)
        expect(json['data']['attributes']).to match_json_schema('group')
      end

      it 'sets current org as group.organization' do
        post(path, params: params)
        group = Group.find(json['data']['id'])
        expect(group.organization).to eq(user.current_organization)
      end

      context 'with external_id', api_token: true do
        let(:params) do
          json_api_params(
            'groups',
            name: 'Creative Collaborators',
            external_id: '100',
          )
        end

        context 'without application access to the org' do
          it 'returns 401' do
            post(
              path,
              params: params,
              headers: { Authorization: "Bearer #{@api_token.token}" },
            )
            expect(response.status).to eq 401
          end
        end

        context 'with application access to the org' do
          let!(:application_org) do
            create(
              :application_organization,
              application: @api_token.application,
              organization: user.current_organization,
            )
          end

          it 'adds external_id to group' do
            post(
              path,
              params: params,
              headers: { Authorization: "Bearer #{@api_token.token}" },
            )
            expect(response.status).to eq 200
            expect(json['data']['attributes']['external_id']).to eq '100'
          end
        end
      end

      context 'with organization_id passed in' do
        let!(:organization) { create(:organization, member: user) }
        let(:params) do
          json_api_params(
            'groups',
            name: 'Creative Collaborators',
            organization_id: organization.id,
          )
        end

        it 'creates the group in the passed in organization' do
          post(path, params: params)
          expect(Group.find(json['data']['id']).organization_id).to eq organization.id
        end
      end
    end
  end

  describe 'PATCH #update' do
    let!(:group) { create(:group, add_admins: [user]) }
    let(:path) { "/api/v1/groups/#{group.id}" }
    let(:params) do
      json_api_params(
        'groups',
        {
          name: 'Creative Competitors',
        }
      )
    end

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      patch(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('group')
    end

    it 'updates the content' do
      expect(group.name).not_to eq('Creative Competitors')
      patch(path, params: params)
      expect(group.reload.name).to eq('Creative Competitors')
    end
  end

  describe 'PATCH #archive' do
    let!(:collection) { create(:collection) }
    let!(:members) { create_list(:user, 3) }
    let!(:group) { create(:group, add_admins: [user], add_members: members) }
    let!(:orig_handle) { group.handle }
    let(:path) { "/api/v1/groups/#{group.id}/archive" }

    before do
      group.add_role(Role::VIEWER, collection)
    end

    it 'returns a 200' do
      patch(path)
      expect(response.status).to eq(200)
    end

    it 'updates archived status of the group' do
      expect(group.active?).to eq(true)
      patch(path)
      expect(group.reload.archived?).to eq(true)
    end

    it 'updates the handle' do
      patch(path)
      expect(group.reload.handle).not_to eq(orig_handle)
    end

    it 'preserves the user roles on the group' do
      patch(path)
      group.reload
      expect(group.members[:users].count).to eq(3)
      expect(group.admins[:users].count).to eq(1)
    end

    it 'removes group from all content' do
      patch(path)
      expect(group.reload.roles_to_resources.count).to eq(0)
    end

    it 'notifies the editors that the item was archived' do
      group.archived = true
      expect(ActivityAndNotificationBuilder).to receive(:call).with(
        actor: @user,
        target: group,
        action: :archived,
        subject_user_ids: (members << user).pluck(:id),
      )
      patch(path)
    end

    context 'without admin access' do
      before do
        user.remove_role(Role::ADMIN, group)
      end

      it 'rejects non-editors' do
        patch(path)
        expect(response.status).to eq(401)
      end
    end
  end
end
