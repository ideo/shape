require 'rails_helper'

RSpec.describe OrganizationTemplates, type: :service do
  let(:organization) { create(:organization) }
  let!(:user) { create(:user, add_to_org: organization) }
  let(:service) { OrganizationTemplates.new(organization, user) }
  let(:worker_double) { double('worker') }

  before do
    allow(OrganizationTemplatesWorker).to receive(:perform_in)
    allow(LinkToSharedCollectionsWorker).to receive(:new).and_return(worker_double)
    allow(worker_double).to receive(:perform)
  end

  describe 'sharing template collection' do
    it 'should link the collection to the creating user and mark it as shared_with_organization' do
      expect(worker_double).to receive(:perform).with(
        [organization.primary_group.user_ids],
        [],
        [anything],
        [],
      )
      service.call
      expect(organization.template_collection.shared_with_organization).to be true
    end
  end

  describe '#call' do
    let(:template_collection) { organization.template_collection }

    before do
      service.call
    end

    it 'should save the attributes on the org' do
      organization.reload
      expect(organization.template_collection_id).to eq template_collection.id
    end

    it 'does not create getting started template' do
      organization.reload
      expect(organization.getting_started_collection).to be_nil
    end

    context 'with template collection' do
      it 'should create a template collection for the org' do
        expect(organization.template_collection.persisted?).to be true
        expect(organization.template_collection.name).to eq("#{organization.name} Templates")
      end

      it 'should add the admin group as editor' do
        expect(
          organization.admin_group.has_role?(
            Role::EDITOR,
            organization.template_collection,
          ),
        ).to be true
      end

      it 'should add the primary group as viewer' do
        expect(
          organization.primary_group.has_role?(
            Role::VIEWER,
            organization.template_collection,
          ),
        ).to be true
      end
    end
    context 'with a shell org' do
      let!(:organization) { create(:organization, shell: true) }
      let(:user_collection) {
        Collection::UserCollection.find_by(
          organization_id: organization.id,
        )
      }
      let(:template_collection) {
        Collection::Global.find_by(
          name: "#{organization.name} Templates",
          organization: organization,
        )
      }
      it 'should add create a org templates card' do
        user_collection.collection_cards.reload
        expect(user_collection.collection_cards.map { |cc| cc.record.id }.include?(template_collection.id)).to eq(true)
      end
    end
  end
end
