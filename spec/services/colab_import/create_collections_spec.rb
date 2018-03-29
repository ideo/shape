require 'rails_helper'

RSpec.describe ColabImport::CreateCollections, type: :service do
  describe '#call' do
    let(:concept_uids) { '-L2MabbTxWEL7FBgL_oL' }
    let(:editor) { create(:user) }
    let(:organization) { create(:organization) }
    let!(:template_collection) do
      create(:collection,
             num_cards: 9,
             organization: organization
           )
    end
    let(:create_collections) do
      ColabImport::CreateCollections.new(
        path_to_json: 'db/import/colab-concept-library-export.json',
        organization: organization,
        template_collection: template_collection,
        editor: editor,
      )
    end
    let(:session_collection) {
      create_collections.root_collection.collections.first
    }
    let(:prototype_collection) {
      session_collection.collections.first
    }
    let(:filestack_file) {
      create(:filestack_file)
    }
    let(:url_exists_double) {
      double('UrlExists', call: true)
    }

    before do
      allow(UrlExists).to receive(:new).and_return(url_exists_double)
      allow(FilestackFile).to receive(:create_from_url).and_return(filestack_file)
      editor.add_role(Role::ADMIN, organization.primary_group)
      # Add user as editor to template and all items
      Roles::AssignToUsers.new(
        object: template_collection,
        role_name: Role::EDITOR,
        users: [editor],
        propagate_to_children: true,
        synchronous: true,
      ).call
      template_collection.roles.reload

      # Create root, session collection and concept collection
      create_collections.call(concept_uids)
    end

    it 'creates root collection' do
      expect(create_collections.root_collection.persisted?).to be true
      expect(create_collections.root_collection.collections.size).to eq(1)
    end

    it 'creates collection for session' do
      expect(session_collection.persisted?).to be true
      expect(session_collection.name).to eq('Q1 2018')
      expect(session_collection.collections.size).to eq(1)
    end

    it 'creates collection for prototype' do
      expect(prototype_collection.persisted?).to be true
      expect(prototype_collection.items)
    end

    it 'has concept name' do
      expect(prototype_collection.name).to eq('Voyaging')
    end

    it 'has breadcrumb with all collections' do
      expect(prototype_collection.breadcrumb.size).to eq(3)
    end

    it 'has concept description' do
      expect(
        prototype_collection.items[0].content
      ).to include('Design principles for improving')
    end
  end
end
