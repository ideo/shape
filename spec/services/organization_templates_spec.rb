require 'rails_helper'

RSpec.describe OrganizationTemplates, type: :service do
  let(:organization) { create(:organization) }
  let(:user) { create(:user, current_organization: organization) }
  let(:user_collection) { create(:user_collection, organization: organization, add_editors: [user]) }
  let(:profile_template) { organization.profile_template }
  let(:filestack_file) { create(:filestack_file) }
  let(:service) { OrganizationTemplates.new(organization, user) }

  before do
    allow(OrganizationTemplatesWorker).to receive(:perform_async)
    allow(FilestackFile).to receive(:create_from_url).and_return(filestack_file)
    allow_any_instance_of(User)
      .to receive(:current_user_collection).and_return(user_collection)
  end

  describe '#call' do
    let(:template_collection) { organization.template_collection }

    before do
      service.call
      profile_template.reload
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
    end

    context 'with profile template' do
      it 'should create a profile template in the templates collection' do
        expect(template_collection.children.count).to be 1
        expect(template_collection.collections.first.master_template?).to be true
      end

      it 'should create two collection cards' do
        expect(profile_template.collection_cards.count).to eq 2
      end

      it 'should add the admin group as editor of the items' do
        expect(
          organization.admin_group.has_role?(
            Role::EDITOR,
            profile_template.items.first,
          ),
        ).to be true
        expect(
          organization.admin_group.has_role?(
            Role::EDITOR,
            profile_template.items.last,
          ),
        ).to be true
      end

      it 'should add the #template tag' do
        # this happens via templateable concern
        expect(profile_template.cached_owned_tag_list).to match_array(['template'])
      end

      it 'should create a image item and a text item' do
        expect(profile_template.items.count).to eq 2
        expect(profile_template.items.first.type).to eq 'Item::FileItem'
        expect(profile_template.items.last.type).to eq 'Item::TextItem'
      end

      it 'should calculate the breadcrumb for the items' do
        item = profile_template.items.first
        expect(item.breadcrumb).to eq [template_collection.id, profile_template.id]
      end
    end

    context 'with profiles collection' do
      it 'should create the profiles collection for the org' do
        expect(organization.profile_collection.persisted?).to be true
        expect(organization.profile_collection.profiles?).to be true
      end

      it 'should add the primary group as a viewer' do
        expect(
          organization.primary_group.has_role?(
            Role::VIEWER,
            organization.profile_collection,
          ),
        ).to be true
      end
    end

    context 'with collections already created' do
      it 'should not create duplicate collections' do
        # calling service.call a second time...
        expect do
          service.call
        end.to not_change(Collection, :count)
      end
    end
  end

  context 'with getting started template' do
    describe '#call' do
      let!(:getting_started_template) do
        create(:collection,
               organization: organization,
               num_cards: 3)
      end
      before do
        ENV['GETTING_STARTED_TEMPLATE_ID'] = getting_started_template.id.to_s
        service.call
        profile_template.reload
      end
      let(:getting_started_collection) do
        organization.getting_started_collection
      end

      it 'invokes the OrganizationTemplatesWorker' do
        expect(OrganizationTemplatesWorker).to have_received(:perform_async).with(
          organization.id,
          getting_started_template.id,
          user.id,
        )
      end
    end
  end
end
