require 'rails_helper'
require './spec/services/collection_broadcaster_shared_setup'

describe Api::V1::CollectionsController, type: :request, json: true, auth: true do
  include_context 'CollectionUpdateBroadcaster setup'
  let(:user) { @user }

  context 'with anonymous (logged-out) user', auth: false do
    describe 'GET #show' do
      let(:path) { "/api/v1/collections/#{collection.id}" }

      context 'with id not found' do
        let(:collection) { Mashie.new(id: 99) }

        it 'returns a 404' do
          get(path)
          expect(response.status).to eq(404)
          expect(json['errors']).to eq(["Couldn't find Collection with 'id'=99"])
        end
      end

      context 'with a normal collection' do
        let(:collection) { create(:collection) }
        it 'returns a 401' do
          get(path)
          expect(response.status).to eq(401)
        end
      end

      context 'with a normal publicly shared collection' do
        let(:collection) { create(:collection, anyone_can_view: true) }
        it 'returns a 200' do
          get(path)
          expect(response.status).to eq(200)
        end
      end

      context 'with an anyone_can_view collection' do
        let(:collection) { create(:collection, anyone_can_view: true) }
        it 'returns a 200' do
          get(path)
          expect(response.status).to eq(200)
        end
      end
    end
  end

  context 'with API user' do
    let!(:api_user) { create(:user, :application_bot) }
    before do
      login_as(api_user)
    end

    describe 'GET #index', create_org: true do
      let(:parent_collection) { create(:collection) }
      let!(:collection) do
        create(:collection, num_cards: 1, add_viewers: [api_user], parent_collection: parent_collection)
      end
      let!(:external_record) do
        create(
          :external_record,
          application: api_user.application,
          externalizable: collection,
          external_id: '123',
        )
      end
      let(:path) do
        api_v1_collections_path(filter: { external_id: '123' })
      end

      it 'returns a 200' do
        get(path)
        expect(response.status).to eq(200)
      end

      it 'matches JSON schema' do
        get(path)
        expect(json['data'].size).to eq(1)
        expect(json['data'].first['attributes']).to match_json_schema('collection', strict: false)
      end

      context 'if collection is archived' do
        before do
          collection.archive!
        end

        it 'is not included in API response' do
          get(path)
          expect(json['data']).to be_empty
        end
      end
    end
  end

  describe 'GET #show', create_org: true do
    let(:parent_collection) { create(:collection) }
    let!(:collection) do
      create(:collection, num_cards: 5, add_viewers: [user], parent_collection: parent_collection)
    end
    let(:created_by) { collection.created_by }
    let(:path) { api_v1_collection_path(collection) }

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
        {
          type: 'collections',
          id: collection.id.to_s,
          name: collection.name,
          can_edit: false,
          has_children: false,
          collection_type: 'Collection',
        }.as_json,
      ])
      expect(json['data']['attributes']['in_my_collection']).to be false
    end

    context 'with a collection that is linked into the user\'s UserCollection (a.k.a. "My Collection")' do
      # make an org where the user has a current_user_collection
      let!(:organization) { create(:organization, member: user) }
      let!(:link_to_my_collection) do
        create(
          :collection_card_link_collection,
          # breadcrumb starts at parent_collection, so that's what has to be linked in
          collection: parent_collection,
          parent: user.current_user_collection,
        )
      end

      it 'adds in_my_collection = true to the json response' do
        get(path)
        expect(json['data']['attributes']['in_my_collection']).to be true
      end
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

    it 'does not log activities by default' do
      expect(ActivityAndNotificationBuilder).not_to receive(:call)
    end

    context 'with page_view=true' do
      let(:path) { api_v1_collection_path(collection, page_view: true) }

      it 'logs a viewed and org joined activity for the current user' do
        expect(ActivityAndNotificationBuilder).to receive(:call).once.ordered.with(
          actor: @user,
          target: @user.current_organization.primary_group,
          action: :joined,
          async: true,
        )
        expect(ActivityAndNotificationBuilder).to receive(:call).once.ordered.with(
          actor: @user,
          target: collection,
          action: :viewed,
          async: true,
        )
        get(path)
      end
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
      let(:viewer) { user }

      it 'includes viewer and created by' do
        get(path)
        expect(users_json.map { |u| u['id'].to_i }).to match_array(
          [viewer.id, created_by.id],
        )
      end

      context 'with editor' do
        let(:editor) { create(:user) }

        before do
          editor.add_role(Role::EDITOR, collection)
        end

        it 'includes viewer and editor' do
          get(path)
          expect(users_json.map { |u| u['id'].to_i }).to match_array(
            [editor.id, viewer.id, created_by.id],
          )
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

      it 'should return a collection' do
        get(path)
        expect(response.status).to eq(200)
      end
    end

    context 'on different org' do
      let!(:first_org) { create(:organization, member: user) }
      let!(:other_org) { create(:organization, member: user) }
      let!(:collection) do
        create(:collection, organization: other_org, add_viewers: [user])
      end

      before do
        user.switch_to_organization(first_org)
      end

      it 'should switch the user to the org' do
        expect(user.current_organization).to eq first_org
        get(path)
        expect(response.status).to eq(200)
        expect(user.reload.current_organization).to eq other_org
      end

      context 'with a common_viewable resource' do
        before do
          collection.update(common_viewable: true)
        end

        it 'should not switch the user to the org' do
          get(path)
          expect(response.status).to eq(200)
          expect(user.reload.current_organization).not_to eq other_org
        end
      end
    end

    context 'with content variables' do
      before do
        GlobalTranslation.create(
          value_en: {
            'CD.QUALITIES.PURPOSE': 'Purpose',
          },
        )
      end

      context 'matching variables' do
        before do
          collection.update(
            name: '{{CD.QUALITIES.PURPOSE}} is my name',
          )
        end

        it 'replaces with value' do
          get(path)
          expect(json['data']['attributes']['name']).to eq(
            'Purpose is my name',
          )
        end
      end

      context 'non-matching variables' do
        before do
          collection.update(
            name: '{{CD.SOMETHING.ELSE}} is my name',
          )
        end

        it 'leaves them in-place' do
          get(path)
          expect(json['data']['attributes']['name']).to eq(
            '{{CD.SOMETHING.ELSE}} is my name',
          )
        end
      end
    end
  end

  describe 'POST #create_template' do
    let(:organization) { create(:organization) }
    let(:template) { create(:collection, master_template: true, organization: organization) }
    let(:to_collection) { create(:collection, organization: organization) }
    let(:path) { '/api/v1/collections/create_template' }
    let(:placement) { 'beginning' }
    let(:raw_params) do
      {
        parent_id: to_collection.id,
        template_id: template.id,
        placement: placement,
      }
    end
    let(:params) { raw_params.to_json }
    let(:instance_double) { double('builder') }
    let(:builder_double_collection) { create(:collection) }

    context 'success' do
      before do
        user.add_role(Role::EDITOR, to_collection)
        user.add_role(Role::VIEWER, template)
        allow(instance_double).to receive(:call).and_return(true)
        allow(instance_double).to receive(:collection).and_return(builder_double_collection)
      end

      it 'calls the CollectionTemplateBuilder' do
        expect(CollectionTemplateBuilder).to receive(:new).with(
          parent: to_collection,
          template: template,
          placement: 'beginning',
          created_by: user,
          external_id: nil,
          collection_params: {},
          collection_card_params: {},
        ).and_return(instance_double)
        post(path, params: params)
      end

      it 'matches Collection schema' do
        post(path, params: params)
        expect(response.status).to eq(200)
        expect(json['data']['attributes']).to match_json_schema('collection', strict: false)
      end

      it 'broadcasts collection updates' do
        expect(CollectionUpdateBroadcaster).to receive(:new).with(
          # broadcast to the collection where we built the template
          to_collection,
          user,
        )
        post(path, params: params)
        created = template.reload.templated_collections.last
        expect(broadcaster_instance).to have_received(:card_updated).with(
          created.parent_collection_card,
        )
      end

      it 'creates Activity item' do
        allow(CollectionTemplateBuilder).to receive(:new).and_return(instance_double)
        allow(ActivityAndNotificationBuilder).to receive(:call)
        expect(ActivityAndNotificationBuilder).to receive(:call).with(
          actor: user,
          target: builder_double_collection,
          source: template,
          action: :template_used,
          content: template.collection_type,
          async: true,
        )
        post(path, params: params)
      end

      context 'with collection name in params' do
        let(:params_with_name) do
          raw_params.merge(collection: { name: 'Awesomeness' }).to_json
        end

        it 'sets to given name' do
          post(path, params: params_with_name)
          template_instance = Collection.find(json['data']['id'])
          expect(template_instance.name).to eq('Awesomeness')
        end
      end

      context 'with row/col placement' do
        let(:placement) do
          { row: 1, col: 2 }
        end

        it 'sets to correct placement' do
          post(path, params: params)
          template_instance = Collection.find(json['data']['id'])
          parent_card = template_instance.parent_collection_card
          expect(parent_card.row).to eq 1
          expect(parent_card.col).to eq 2
        end
      end

      context 'as bot user' do
        let!(:application) { create(:application, user: user, add_orgs: [organization]) }
        let(:params_with_external_id) do
          raw_params.merge(external_id: 'abc123').to_json
        end

        it 'adds external_id if present' do
          expect do
            post(path, params: params_with_external_id)
          end.to change(ExternalRecord, :count).by(1)
          expect(response.status).to eq(200)
          template_instance = Collection.find(json['data']['id'])
          external_record = template_instance.external_records.find_by(application_id: application.id)
          expect(external_record.external_id).to eq('abc123')
        end
      end

      context 'with submission template' do
        let!(:submission_box) { create(:submission_box, add_editors: [user]) }
        let!(:subcollections) { create_list(:collection, 2, parent_collection: template, master_template: true, num_cards: 2) }
        let(:to_collection) { create(:submissions_collection, submission_box: submission_box) }

        it 'should set up submission attrs' do
          post(path, params: params)
          template_instance = Collection.find(json['data']['id'])
          expect(template_instance.submission?).to be true
        end
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
      it 'returns a 422' do
        post(path, params: params)
        expect(response.status).to eq(422)
      end
    end
  end

  describe 'PATCH #update' do
    # give it a parent collection so that it has a parent_collection_card
    let(:tagged_user) { create(:user) }
    let!(:collection) { create(:collection, parent_collection: create(:collection), add_editors: [user]) }
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
        let(:card_attrs) do
          [{
            id: collection_card.id,
            width: 3,
            row: 4,
            col: 5,
          }]
        end
        let(:raw_params) do
          {
            id: collection.id,
            collection_cards_attributes: card_attrs,
          }
        end

        it 'returns a 200' do
          patch(path, params: params)
          expect(response.status).to eq(200)
        end

        it 'broadcasts collection updates' do
          expect(broadcaster_instance).to receive(:card_attrs_updated).with(card_attrs.as_json)
          patch(path, params: params)
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

    it 'broadcasts collection_updated and parent card_updated' do
      expect(broadcaster_instance).to receive(:collection_updated)
      expect(broadcaster_instance).to receive(:card_updated).with(
        collection.parent_collection_card,
      )
      patch(path, params: params)
    end

    context 'updating the cached_cover' do
      before do
        collection.update(
          cached_cover: {
            subtitle_hidden: true,
            hardcoded_subtitle: 'Lorem ipsum.',
          },
        )
      end

      context 'without hardcoded cover attributes' do
        let(:raw_params) do
          {
            id: collection.id,
          }
        end

        it 'does not override existing hardcoded cover attributes' do
          patch(path, params: params)
          collection.reload
          expect(collection.cached_cover['subtitle_hidden']).to be true
          expect(collection.cached_cover['hardcoded_subtitle']).to eq 'Lorem ipsum.'
        end
      end

      context 'with hardcoded cover attributes' do
        let(:raw_params) do
          {
            id: collection.id,
            subtitle_hidden: false,
            hardcoded_subtitle: 'Dolor sit emet.',
          }
        end

        it 'updates hardcoded cover attributes' do
          patch(path, params: params)
          collection.reload
          expect(collection.cached_cover['subtitle_hidden']).to be false
          expect(collection.cached_cover['hardcoded_subtitle']).to eq 'Dolor sit emet.'
        end
      end
    end

    it 'broadcasts collection updates' do
      expect(broadcaster_instance).to receive(:collection_updated)
      patch(path, params: params)
    end

    it 'does not call LinkBroadcastWorker unless there are links' do
      expect(LinkBroadcastWorker).not_to receive(:perform_async)
      patch(path, params: params)
    end

    context 'with cards linked to this collection' do
      let(:parent_of_links) { create(:collection) }
      let!(:linked_card) do
        create(:collection_card_link_collection, parent: parent_of_links, collection: collection)
      end

      it 'calls LinkBroadcastWorker' do
        expect(LinkBroadcastWorker).to receive(:perform_async).with(
          collection.id,
          'Collection',
          user.id,
        )
        patch(path, params: params)
      end
    end

    it 'logs a edited activity for the collection' do
      expect(ActivityAndNotificationBuilder).to receive(:call).with(
        actor: @user,
        target: collection,
        action: :edited,
        async: true,
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

    context 'with row and col' do
      let!(:collection) { create(:board_collection, add_editors: [user]) }
      let(:card_attrs) do
        [{
          id: collection_card.id,
          width: 3,
          row: 4,
          col: 5,
        }]
      end
      let(:params) do
        json_api_params(
          'collections',
          raw_params.merge(
            collection_cards_attributes: card_attrs,
          ),
        )
      end

      it 'updates card col and row' do
        expect(collection_card.row).not_to eq(4)
        expect(collection_card.col).not_to eq(5)
        patch(path, params: params)
        expect(response.status).to eq(200)
        collection_card.reload
        expect(collection_card.row).to eq(4)
        expect(collection_card.col).to eq(5)
      end

      it 'broadcasts card_attrs_updated' do
        expect(broadcaster_instance).to receive(:card_attrs_updated).with(card_attrs.as_json)
        patch(path, params: params)
      end
    end
  end

  describe 'POST #clear_collection_cover' do
    let!(:collection) { create(:collection, parent_collection: create(:collection), add_editors: [user]) }
    let(:collection_card) do
      create(:collection_card_image, order: 0, width: 1, parent: collection, is_cover: true)
    end
    let(:path) { "/api/v1/collections/#{collection.id}/clear_collection_cover" }

    before do
      user.add_role(Role::VIEWER, collection_card.item)
    end

    it 'should clear the cover from the collection' do
      post(path)
      expect(collection_card.reload.is_cover).to be false
    end

    it 'broadcasts card_updated with parent_collection_card' do
      expect(broadcaster_instance).to receive(:card_updated).with(
        collection.parent_collection_card,
      )
      post(path)
    end
  end

  describe 'POST #background_update_template_instances' do
    let(:template) { create(:collection, master_template: true, add_editors: [user], num_cards: 1) }
    let(:path) { "/api/v1/collections/#{template.id}/background_update_template_instances" }
    let!(:instance) { create(:collection, template: template) }

    it 'should call the UpdateTemplateInstancesWorker with :update_all action' do
      expect(UpdateTemplateInstancesWorker).to receive(:perform_async).with(
        template.id,
        template.collection_cards.pluck(:id),
        :update_all,
      )
      post(path, params: { ids: [template.collection_cards.pluck(:id)] }.to_json)
    end

    describe 'with type Item::TextItem' do
      it 'should call the UpdateTemplateInstancesWorker with :update_text_content action' do
        expect(UpdateTemplateInstancesWorker).to receive(:perform_async).with(
          template.id,
          template.collection_cards.pluck(:id),
          :update_text_content,
        )
        post(path, params: { type: 'Item::TextItem', ids: [template.collection_cards.first.id] }.to_json)
      end
    end

    describe 'with type Item::QuestionItem' do
      it 'should call the UpdateTemplateInstancesWorker with :update_question_content action' do
        expect(UpdateTemplateInstancesWorker).to receive(:perform_async).with(
          template.id,
          template.collection_cards.pluck(:id),
          :update_question_content,
        )
        post(path, params: { type: 'Item::QuestionItem', ids: [template.collection_cards.first.id] }.to_json)
      end
    end
  end

  describe 'POST #background_update_live_test' do
    let(:test_collection) { create(:test_collection, :launched, add_editors: [user]) }
    let(:path) { "/api/v1/collections/#{test_collection.id}/background_update_live_test" }
    let(:card) { test_collection.collection_cards.last }

    it 'should call the TestResultsCollection::CreateContentWorker' do
      expect(TestResultsCollection::CreateContentWorker).to receive(:perform_async).with(
        test_collection.test_results_collection.id,
        nil,
        card.id,
      )
      post(path, params: { collection_card_id: card.id }.to_json)
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

      it 'unmarks private setting' do
        collection.update(cached_inheritance: { private: true })
        patch(path)
        collection.reload
        expect(collection.cached_inheritance['private']).to be false
      end
    end
  end

  describe 'POST #insert_row' do
    let!(:collection) { create(:collection) }
    let(:action) { :insert_row }
    let(:raw_params) do
      {
        row: 1,
      }
    end.to_json
    let(:params) { raw_params.to_json }
    let(:path) { "/api/v1/collections/#{collection.id}/insert_row" }

    before do
      user.add_role(Role::EDITOR, collection)
    end

    it 'should call row inserter' do
      expect(CollectionGrid::RowInserter).to receive(:call).with(
        collection: collection,
        row: 1,
        action: action,
      )
      post(path, params: params)
    end

    it 'should return no content' do
      post(path, params: params)
      expect(response.status).to eq(204)
    end

    it 'should touch the collection' do
      expect do
        post(path, params: params)
        collection.reload
      end.to change(collection, :updated_at)
    end

    it 'should broadcast an update' do
      expect(broadcaster_instance).to receive(:row_updated).with(
        row: 1,
        action: action,
      )
      post(path, params: params)
    end
  end

  describe 'POST #remove_row' do
    let!(:collection) { create(:collection) }
    let(:action) { :remove_row }
    let(:raw_params) do
      {
        row: 1,
        action: action,
      }
    end.to_json
    let(:params) { raw_params.to_json }
    let(:path) { "/api/v1/collections/#{collection.id}/remove_row" }

    before do
      user.add_role(Role::EDITOR, collection)
    end

    it 'should call row inserter with remove action' do
      expect(CollectionGrid::RowInserter).to receive(:call).with(
        collection: collection,
        row: 1,
        action: action,
      )
      post(path, params: params)
    end

    it 'should return no content' do
      post(path, params: params)
      expect(response.status).to eq(204)
    end

    it 'should touch the collection' do
      collection.update_column(:updated_at, 2.day.ago)
      expect do
        post(path, params: params)
        collection.reload
      end.to change(collection, :updated_at)
    end

    it 'should broadcast an update' do
      expect(broadcaster_instance).to receive(:row_updated).with(
        row: 1,
        action: action,
      )
      post(path, params: params)
    end
  end

  describe 'POST #set_submission_box_template' do
    let!(:submission_box) { create(:submission_box) }
    let(:path) { '/api/v1/collections/set_submission_box_template' }
    let(:params) do
      {
        box_id: submission_box.id,
        submission_box_type: :text,
      }.to_json
    end

    context 'without edit access to the collection' do
      it 'returns a 401' do
        post(path, params: params)
        expect(response.status).to eq(401)
      end
    end

    context 'with edit access to the collection' do
      let!(:submission_box) { create(:submission_box, add_editors: [user]) }

      it 'returns a 200' do
        post(path, params: params)
        expect(response.status).to eq(200)
      end

      context 'even when pinned_and_locked' do
        let!(:parent_collection_card) do
          create(:collection_card, collection: submission_box, pinned: true)
        end

        it 'returns a 200' do
          expect(submission_box.pinned_and_locked?).to be true
          post(path, params: params)
          expect(response.status).to eq(200)
        end
      end
    end
  end

  describe 'GET #challenge_phase_collections' do
    let!(:challenge) do
      create(
        :collection,
        num_cards: 2,
        collection_type: :challenge,
        record_type: :collection,
        add_viewers: [user],
      )
    end
    let!(:phases) do
      challenge.collections.map do |collection|
        collection.update(collection_type: :phase)
        collection
      end
    end
    let(:path) { "/api/v1/collections/#{challenge.id}/challenge_phase_collections" }

    it 'returns immediate sub-collections that are phases' do
      get(path)
      expect(response.status).to eq(200)
      expect(json['data'].size).to eq(2)
      expect(json_ids.map(&:to_i)).to match_array(phases.map(&:id))
    end
  end

  describe 'GET #next_available_submission_test' do
    let(:submission_box) { create(:submission_box, add_editors: [user]) }
    let(:submissions_collection) { create(:submissions_collection, submission_box: submission_box) }
    let(:submission) { create(:collection, :submission, parent_collection: submissions_collection, add_editors: [user]) }
    let(:collection) { submission }
    let(:path) { "/api/v1/collections/#{collection.id}/next_available_submission_test" }

    it 'finds parent submission box and next available test' do
      expect_any_instance_of(Collection::SubmissionBox).to receive(:random_next_submission_test).with(
        for_user: user,
        omit_id: nil,
      ).and_return([])
      get(path)
      expect(response.status).to eq(200)
    end

    describe 'with the submission_box itself' do
      let(:collection) { submission_box }

      it 'finds current submission box and next available test' do
        expect_any_instance_of(Collection::SubmissionBox).to receive(:random_next_submission_test).with(
          for_user: user,
          omit_id: nil,
        ).and_return([])
        get(path)
        expect(response.status).to eq(200)
      end
    end

    describe 'with a test collection' do
      let(:collection) { create(:test_collection, parent_collection: submission) }

      it 'finds parent submission box and next available test, omitting current test' do
        expect_any_instance_of(Collection::SubmissionBox).to receive(:random_next_submission_test).with(
          for_user: user,
          omit_id: collection.id,
        ).and_return([])
        get(path)
        expect(response.status).to eq(200)
      end
    end
  end
end
