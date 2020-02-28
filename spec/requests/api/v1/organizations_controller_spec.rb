require 'rails_helper'

describe Api::V1::OrganizationsController, type: :request, json: true, auth: true do
  let(:user) { @user }

  context 'serializable organization' do
    let!(:organization) { create(:organization) }
    let(:path) { '/api/v1/organizations/current' }

    before do
      user.update_attributes(current_organization: organization)
    end

    describe '#is_within_trial_period' do
      context 'trial already ended' do
        it 'is false' do
          organization.update_attributes(trial_ends_at: 1.day.ago)
          get(path)
          expect(json['data']['attributes']['is_within_trial_period']).to eq(false)
        end
      end

      context 'trial ending in the future' do
        it 'is true' do
          organization.update_attributes(trial_ends_at: 1.day.from_now)
          get(path)
          expect(json['data']['attributes']['is_within_trial_period']).to eq(true)
        end
      end
    end

    describe '#price_per_user' do
      it 'pulls price per user from the Organization constant' do
        get(path)
        expect(json['data']['attributes']['price_per_user']).to eq(Organization::PRICE_PER_USER)
      end
    end

    describe '#current_billing_period_start' do
      it 'should be the start of the current month' do
        get(path)
        expect(json['data']['attributes']['current_billing_period_start']).to eq(Time.now.utc.beginning_of_month.to_s)
      end
    end

    describe '#current_billing_period_end' do
      it 'should be the end of the current month' do
        get(path)
        expect(json['data']['attributes']['current_billing_period_end']).to eq(Time.now.utc.end_of_month.to_s)
      end
    end

    describe '#trial_ends_at' do
      context 'trial_ends_at is not set' do
        it 'is nil' do
          organization.update_attributes(trial_ends_at: nil)
          get(path)
          expect(json['data']['attributes']['trial_ends_at']).to eq(nil)
        end
      end

      context 'trial_ends_at is set' do
        it 'includes a formatted date' do
          organization.update_attributes(trial_ends_at: 1.day.from_now)
          get(path)
          expect(json['data']['attributes']['trial_ends_at']).to eq(1.day.from_now.to_date.to_s)
        end
      end
    end

    describe '#overdue' do
      context 'overdue at is not set' do
        it 'is false' do
          organization.update_attributes(overdue_at: nil)
          get(path)
          expect(json['data']['attributes']['overdue']).to eq(false)
        end
      end

      context 'overdue less than one week' do
        it 'is false' do
          organization.update_attributes(overdue_at: 6.days.ago)
          get(path)
          expect(json['data']['attributes']['overdue']).to eq(false)
        end
      end

      context 'overdue more than one week' do
        it 'is true' do
          organization.update_attributes(overdue_at: 8.days.ago)
          get(path)
          expect(json['data']['attributes']['overdue']).to eq(true)
        end
      end
    end

    describe '#inaccessible_at' do
      context 'overdue_at is not set' do
        it 'is nil' do
          organization.update_attributes(overdue_at: nil)
          get(path)
          expect(json['data']['attributes']['inaccessible_at']).to eq(nil)
        end
      end

      context 'overdue_at is set' do
        it 'is set to 2 weeks after the overdue_at date' do
          organization.update_attributes(overdue_at: 1.week.from_now)
          get(path)
          expect(json['data']['attributes']['inaccessible_at']).to eq(3.weeks.from_now.to_s(:mdy))
        end
      end
    end
  end

  describe 'GET #index' do
    let!(:organizations) { create_list(:organization, 2, member: user) }
    let(:other_org) { create(:organization) }
    let(:path) { '/api/v1/organizations' }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'returns organizations linked to user' do
      get(path)
      expect(json['data'].count).to eq 2
      expect(json['data'].map { |i| i['id'].to_i }).to match_array(organizations.pluck(:id))
    end

    context 'with external_id filter', api_token: true do
      let(:organization) { organizations.first }
      # Necessary, as this is how an org is linked to a bot user
      let!(:application_organization) do
        create(
          :application_organization,
          organization: organization,
          application: @api_token.application,
        )
      end
      let!(:external_record) do
        create(
          :external_record,
          externalizable: organization,
          external_id: 99,
          application_id: @api_token.application.id,
        )
      end
      let(:path) { '/api/v1/organizations?filter[external_id]=99' }

      it 'returns organization(s) matching external_id' do
        get(path)
        expect(json['data'].count).to eq 1
        expect(json['data'].first['id'].to_i).to eq organization.id
      end
    end
  end

  describe 'GET #current' do
    let!(:organization) { create(:organization) }
    let(:path) { '/api/v1/organizations/current' }

    before do
      user.update_attributes(current_organization: organization)
    end

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches user.current_organization' do
      get(path)
      expect(json['data']['id'].to_i).to eq(user.current_organization_id)
    end
  end

  describe 'GET #show' do
    let!(:organization) { create(:organization) }
    let(:path) { "/api/v1/organizations/#{organization.id}" }

    before do
      user.add_role(Role::MEMBER, organization.primary_group)
      organization.update(slug: 'some-slug')
    end

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches Organization schema' do
      get(path)
      expect(json['data']['attributes']).to match_json_schema('organization')
    end
  end

  describe 'GET #my_collection' do
    let!(:organization) { create(:organization, slug: Faker::Internet.slug(nil, '-')) }
    let!(:user_collection) do
      create(:user_collection, organization: organization, add_editors: [user])
    end
    let(:path) { "/api/v1/organizations/#{organization.slug}/my_collection" }

    before do
      user.add_role(Role::MEMBER, organization.primary_group)
    end

    it 'redirects to show the user collection' do
      expect(get(path)).to redirect_to(api_v1_collection_path(user_collection))
    end

    it 'passes page_view parameter to collections API' do
      expect(get("#{path}?page_view=true")).to redirect_to(api_v1_collection_path(user_collection, page_view: true))
    end
  end

  describe 'POST #create', vcr: { match_requests_on: %i[host path] } do
    let(:path) { '/api/v1/organizations/' }
    let!(:current_user) { create(:user) }
    let(:params) do
      json_api_params(
        'organizations',
        'name': 'IDEO U',
        'handle': 'ideo-u',
      )
    end

    before do
      shell_builder = OrganizationShellBuilder.new
      shell_builder.save
    end

    it 'returns a 200' do
      post(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      post(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('organization')
    end

    context 'setting in app billing' do
      it 'does not accept the in_app_billing param if you are not super admin' do
        post(path, params: json_api_params('organizations', name: 'IDEO U', in_app_billing: false))
        # in_app_billing defaults to true (see app/models/organization.rb)
        expect(json['data']['attributes']['in_app_billing']).to be(true)
      end

      it 'allows setting in_app_billing param if you are a super admin' do
        user.add_role(Role::SUPER_ADMIN)
        post(path, params: json_api_params('organizations', name: 'IDEO U', in_app_billing: false))

        expect(json['data']['attributes']['in_app_billing']).to eql(false)
      end
    end

    context 'after calling templates/use_in_my_collection' do
      let(:template) { create(:collection, common_viewable: true, master_template: true) }
      let(:template_path) { "/templates/#{template.id}/use_in_my_collection" }

      it 'stores template_id in session and returns it in meta' do
        # call this path to store the template_id in the session
        get(template_path)
        expect(response.status).to eq(302)
        # now after org create, meta should include use_template_id
        post(path, params: params)
        expect(json['meta']).to eq(
          'use_template_id' => template.id.to_s,
        )
      end
    end

    context 'with invalid params' do
      let(:params) do
        json_api_params(
          'organizations',
          'name': nil,
        )
      end

      it 'returns a 422 with organization errors' do
        post(path, params: params)
        expect(response.status).to eq(422)
        expect(json['errors'].first['title']).to eq 'Invalid name'
      end
    end
  end

  describe 'PATCH #update', vcr: { match_requests_on: %i[host method path_ignore_id] } do
    let!(:organization) { create(:organization, admin: user) }
    let(:path) { "/api/v1/organizations/#{organization.id}" }
    let(:params) do
      json_api_params(
        'organizations',
        name: 'Acme Inc 2.0',
        domain_whitelist: %w[acme.com subsidiary.acme.com],
      )
    end

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      patch(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('organization')
    end

    it 'updates the name and domain_whitelist' do
      expect(organization.name).not_to eq('Acme Inc 2.0')
      patch(path, params: params)
      organization.reload
      expect(organization.name).to eq('Acme Inc 2.0')
      expect(organization.domain_whitelist).to match_array(%w[acme.com subsidiary.acme.com])
    end

    context 'setting in app billing' do
      before do
        organization.update_attributes(in_app_billing: true)
      end

      it 'does not work if you are not super admin' do
        patch(path, params: json_api_params('organizations', in_app_billing: false))
        expect(organization.reload.in_app_billing).to eql(true)
      end

      it 'works if you are a super admin' do
        user.add_role(Role::SUPER_ADMIN)
        expect_any_instance_of(Organization).to receive(:update_subscription)
        patch(path, params: json_api_params('organizations', in_app_billing: false))
        expect(organization.reload.in_app_billing).to eql(false)
      end
    end
  end

  describe 'PATCH #add_terms_text' do
    let!(:current_user) { @user }
    let!(:organization) { create(:organization, admin: user) }
    let(:path) { "/api/v1/organizations/#{organization.id}/add_terms_text" }
    let(:params) do
      json_api_params(
        'organizations',
        'name': 'Acme Inc 2.0',
      )
    end

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'updates the the terms_text_item' do
      expect(organization.terms_text_item_id).to be nil
      patch(path, params: params)
      organization.reload
      expect(organization.terms_text_item_id).not_to be nil
    end

    it 'sets the admin group as editor of the terms text item' do
      patch(path, params: params)
      organization.reload
      organization.terms_text_item.reload
      expect(organization.admin_group.has_role?(:editor, organization.terms_text_item)).to be true
      # user should be able to edit via admin_group membership
      expect(organization.terms_text_item.can_edit?(user)).to be true
    end
  end

  describe 'PATCH #remove_terms_text' do
    let!(:current_user) { @user }
    let!(:organization) { create(:organization, admin: user, terms_text_item_id: 3) }
    let(:path) { "/api/v1/organizations/#{organization.id}/remove_terms_text" }
    let(:params) do
      json_api_params(
        'organizations',
        'name': 'Acme Inc 2.0',
      )
    end

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'clears the the terms_text_item' do
      expect(organization.terms_text_item_id).to be 3
      patch(path, params: params)
      expect(organization.terms_text_item_id).not_to be nil
    end
  end

  describe 'PATCH #bump_terms_version' do
    let!(:current_user) { @user }
    let!(:organization) { create(:organization, admin: user) }
    let(:path) { "/api/v1/organizations/#{organization.id}/bump_terms_version" }

    it 'returns a 200' do
      patch(path)
      expect(response.status).to eq(200)
    end

    it 'updates the organization terms_version' do
      expect(organization.terms_version).to be nil
      patch(path)
      expect(organization.terms_version).not_to eq 1
    end

    it 'updates the user org_terms_accepted_versions' do
      expect(user.org_terms_accepted_versions).to be nil
      patch(path)
      expect(user.org_terms_accepted_versions).not_to be nil
      expect(user.current_org_terms_accepted).to be true
    end
  end

  describe 'GET #check_payments' do
    let!(:current_user) { @user }
    let!(:organization) { create(:organization, admin: user) }
    let(:path) { "/api/v1/organizations/#{organization.id}/check_payments" }
    let(:payment_method) { double('payment_method', id: 234) }
    let(:network_organization) { double('network organization', id: 22) }
    before do
      allow(NetworkApi::Organization).to receive(:find_by_external_id).with(organization.id).and_return(network_organization)
      allow(NetworkApi::PaymentMethod).to receive(:find).with(
        organization_id: network_organization.id,
        default: true,
      ).and_return([payment_method])
    end

    it 'calls NetworkApi::PaymentMethod to check status' do
      expect(NetworkApi::PaymentMethod).to receive(:find).with(
        organization_id: network_organization.id,
        default: true,
      )
      get(path)
      expect(response.status).to eq(200)
    end
  end
end
