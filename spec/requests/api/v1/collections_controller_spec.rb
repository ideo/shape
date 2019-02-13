require 'rails_helper'

describe Api::V1::CollectionsController, type: :request, json: true, auth: true do
  let(:user) { @user }

  describe 'GET #show', create_org: true do
    let!(:collection) do
      create(:collection, num_cards: 5, add_viewers: [user])
    end
    let(:path) { "/api/v1/collections/#{collection.id}" }

    it 'returns a 200' do
      get(path)
      expect(response.status).to eq(200)
    end

    it 'matches JSON schema' do
      get(path)
      # we don't use strict matching since some attrs only appear conditionally
      expect(json['data']['attributes']).to match_json_schema('collection', strict: false)
    end

    it 'should include breadcrumb' do
      user.add_role(Role::VIEWER, collection)
      collection.reload
      collection.recalculate_breadcrumb!
      get(path)
      expect(json['data']['attributes']['breadcrumb']).to match_array([
        { 'type' => 'collections', 'id' => collection.id, 'name' => collection.name, 'can_edit' => false },
      ])
    end

    it 'has no editors' do
      get(path)
      roles = json['data']['relationships']['roles']['data']
      editor_role = roles.select { |role| role['name'] == 'editor' }
      expect(editor_role).to be_empty
    end

    it 'returns can_edit as false' do
      get(path)
      expect(json['data']['attributes']['can_edit']).to eq(false)
    end

    it 'logs a viewed and org joined activity for the current user' do
      expect(ActivityAndNotificationBuilder).to receive(:call).once.ordered.with(
        actor: @user,
        target: @user.current_organization.primary_group,
        action: :joined,
      )
      expect(ActivityAndNotificationBuilder).to receive(:call).once.ordered.with(
        actor: @user,
        target: collection,
        action: :viewed,
      )
      get(path)
    end

    context 'with editor' do
      let!(:collection) do
        create(:collection, num_cards: 5, add_editors: [user])
      end

      it 'returns can_edit as true' do
        get(path)
        expect(json['data']['attributes']['can_edit']).to eq(true)
      end
    end

    describe 'included' do
      let(:collection_cards_json) { json_included_objects_of_type('collection_cards') }
      let(:items_json) { json_included_objects_of_type('items') }
      let(:users_json) { json_included_objects_of_type('users') }

      before do
        collection.items.each { |item| user.add_role(Role::VIEWER, item) }
      end

      it 'includes viewers' do
        get(path)
        expect(users_json.map { |u| u['id'].to_i }).to match_array([user.id])
      end

      context 'with editor' do
        let!(:collection) do
          create(:collection, num_cards: 5, add_editors: [user])
        end

        it 'includes only editors' do
          get(path)
          expect(users_json.map { |u| u['id'].to_i }).to match_array([user.id])
        end
      end
    end

    context 'as master template' do
      before do
        collection.update_attributes(master_template: true)
      end
      let!(:template_instances) do
        create_list(:collection, 3, template: collection, created_by: user)
      end

      it 'includes number of template instances' do
        get(path)
        expect(json['data']['attributes']['template_num_instances']).to eq(3)
      end
    end

    context 'with getting_started_shell collection' do
      let(:getting_started) { create(:collection, num_cards: 2) }
      before do
        user.add_role(Role::EDITOR, collection)
        collection.update(getting_started_shell: true, cloned_from: getting_started)
      end

      it 'calls the PopulateGettingStartedShellCollection service' do
        expect(PopulateGettingStartedShellCollection).to receive(:call).with(
          collection,
          for_user: user,
        )
        get(path)
      end
    end

    context 'with deactivated org' do
      before do
        # don't invoke callbacks, just mark as deactivated
        collection.organization.update_column(:deactivated, true)
      end

      it 'should return a 404' do
        get(path)
        expect(response.status).to eq(404)
      end
    end

    context 'with archived collection' do
      before do
        collection.archive!
      end

      it 'should return a 404' do
        get(path)
        expect(response.status).to eq(404)
      end
    end
  end

  describe 'POST #create_template' do
    let(:organization) { create(:organization) }
    let(:template) { create(:collection, master_template: true, organization: organization) }
    let(:to_collection) { create(:collection, organization: organization) }
    let(:path) { '/api/v1/collections/create_template' }
    let(:raw_params) do
      {
        parent_id: to_collection.id,
        template_id: template.id,
        placement: 'beginning',
      }
    end
    let(:params) { raw_params.to_json }
    let(:instance_double) { double('builder') }

    context 'success' do
      before do
        user.add_role(Role::EDITOR, to_collection)
        user.add_role(Role::VIEWER, template)
        allow(instance_double).to receive(:call).and_return(true)
        allow(instance_double).to receive(:collection).and_return(create(:collection))
      end

      it 'calls the CollectionTemplateBuilder' do
        expect(CollectionTemplateBuilder).to receive(:new).with(
          parent: to_collection,
          template: template,
          placement: 'beginning',
          created_by: user,
        ).and_return(instance_double)
        post(path, params: params)
      end

      it 'matches Collection schema' do
        post(path, params: params)
        expect(response.status).to eq(200)
        expect(json['data']['attributes']).to match_json_schema('collection', strict: false)
      end

      it 'broadcasts collection updates' do
        expect(CollectionUpdateBroadcaster).to receive(:call).with(
          to_collection,
          user,
        )
        post(path, params: params)
      end
    end

    context 'without permission' do
      it 'returns a 401' do
        post(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'trying to create inside a template' do
      let(:to_collection) { create(:collection, master_template: true, organization: organization) }
      it 'returns a 400' do
        post(path, params: params)
        expect(response.status).to eq(400)
      end
    end
  end

  describe 'PATCH #update' do
    let!(:collection) { create(:collection, add_editors: [user]) }
    let(:collection_card) do
      create(:collection_card_text, order: 0, width: 1, parent: collection)
    end
    let(:path) { "/api/v1/collections/#{collection.id}" }
    let(:raw_params) do
      {
        id: collection.id,
        name: 'Who let the dogs out?',
        collection_cards_attributes: [
          {
            id: collection_card.id,
            order: 1,
            width: 3,
          },
        ],
      }
    end
    let(:params) do
      json_api_params(
        'collections',
        raw_params,
      )
    end

    before do
      user.add_role(Role::VIEWER, collection_card.item)
    end

    context 'as content editor' do
      before do
        user.remove_role(Role::EDITOR, collection)
        user.add_role(Role::CONTENT_EDITOR, collection)
      end

      context 'updating collection name on a system_required collection' do
        let(:collection) { create(:user_profile) }

        it 'returns a 401' do
          patch(path, params: params)
          expect(response.status).to eq(401)
        end
      end

      context 'updating collection cards attributes' do
        let(:raw_params) do
          {
            id: collection.id,
            collection_cards_attributes: [
              {
                id: collection_card.id,
                order: 1,
                width: 3,
              },
            ],
          }
        end

        it 'returns a 200' do
          patch(path, params: params)
          expect(response.status).to eq(200)
        end
      end
    end

    it 'returns a 200' do
      patch(path, params: params)
      expect(response.status).to eq(200)
    end

    it 'matches Collection schema' do
      patch(path, params: params)
      expect(json['data']['attributes']).to match_json_schema('collection', strict: false)
    end

    it 'updates the name' do
      expect(collection.name).not_to eq('Who let the dogs out?')
      patch(path, params: params)
      expect(collection.reload.name).to eq('Who let the dogs out?')
    end

    it 'updates the collection_card' do
      expect(collection_card.width).not_to eq(3)
      expect(collection_card.order).not_to eq(1)
      patch(path, params: params)
      expect(collection_card.reload.width).to eq(3)
      expect(collection_card.reload.order).to eq(1)
    end

    it 'broadcasts collection updates' do
      expect(CollectionUpdateBroadcaster).to receive(:call).with(
        collection,
        user,
      )
      patch(path, params: params)
    end

    it 'logs a edited activity for the collection' do
      expect(ActivityAndNotificationBuilder).to receive(:call).with(
        actor: @user,
        target: collection,
        action: :edited,
      )
      patch(path, params: params)
    end

    context 'with cancel_sync == true' do
      let(:params) do
        json_api_params(
          'collections',
          raw_params,
          cancel_sync: true,
        )
      end

      it 'returns a 204 no content' do
        patch(path, params: params)
        expect(response.status).to eq(204)
      end
    end
  end

  describe 'POST #clear_collection_cover' do
    let!(:collection) { create(:collection, add_editors: [user]) }
    let(:collection_card) do
      create(:collection_card_image, order: 0, width: 1, parent: collection, is_cover: true)
    end
    let(:path) { "/api/v1/collections/#{collection.id}/clear_collection_cover" }

    before do
      user.add_role(Role::VIEWER, collection_card.item)
      post(path)
    end

    it 'should clear the cover from the collection' do
      expect(collection_card.reload.is_cover).to be false
    end
  end

  describe 'PATCH #submit' do
    let(:submission_box) { create(:submission_box, hide_submissions: true) }
    let(:submissions_collection) { submission_box.submissions_collection }
    let(:collection) { create(:collection, :submission, parent_collection: submissions_collection, add_editors: [user]) }
    let(:path) { "/api/v1/collections/#{collection.id}/submit" }

    before do
      submission_box.setup_submissions_collection!
      collection.submission_attrs['hidden'] = true
      collection.save
    end

    it 'should submit the submission' do
      expect(Roles::MergeToChild).to receive(:call).with(
        parent: submission_box,
        child: collection,
      )
      patch(path)
      expect(collection.reload.submission_attrs['hidden']).to be false
    end
  end

  describe 'DELETE #destroy' do
    let(:path) { "/api/v1/collections/#{collection.id}" }

    context 'with a normal collection' do
      let!(:collection) { create(:collection, add_editors: [user]) }

      it 'should not allow the destroy action' do
        delete(path)
        expect(response.status).to eq(401)
      end
    end

    context 'with an incomplete SubmissionBox' do
      let!(:collection) { create(:submission_box, add_editors: [user]) }

      it 'should allow the destroy action' do
        delete(path)
        expect(response.status).to eq(200)
      end

      it 'should not allow the destroy action unless user is an editor' do
        user.remove_role(Role::EDITOR, collection)
        delete(path)
        expect(response.status).to eq(401)
      end
    end

    context 'with an existing SubmissionBox' do
      let!(:collection) { create(:submission_box, add_editors: [user], submission_box_type: :file) }

      it 'should not allow the destroy action' do
        delete(path)
        expect(response.status).to eq(401)
      end
    end
  end

  describe 'PATCH #restore_permissions' do
    let!(:parent) { create(:collection) }
    let(:path) { "/api/v1/collections/#{collection.id}/restore_permissions" }

    context 'without edit access to the collection' do
      let!(:collection) { create(:collection, parent_collection: parent) }

      it 'returns a 401' do
        patch(path)
        expect(response.status).to eq(401)
      end
    end

    context 'with edit access to the collection' do
      let!(:collection) { create(:collection, add_editors: [user], parent_collection: parent) }

      it 'returns a 200' do
        patch(path)
        expect(response.status).to eq(200)
      end

      it 'calls Roles::MergeToChild' do
        expect(Roles::MergeToChild).to receive(:call).with(
          parent: parent,
          child: collection,
        )
        patch(path)
      end
    end
  end
end
