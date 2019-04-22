require 'rails_helper'

RSpec.describe OrganizationTemplatesWorker, type: :service do
  let(:user) { create(:user) }
  let(:organization) { create(:organization) }
  let(:user_collection) { create(:user_collection, organization: organization, add_editors: [user]) }
  let(:profile_template) { organization.profile_template }
  let(:filestack_file) { create(:filestack_file) }
  let!(:shape_administration) { create(:collection, organization: organization) }
  # it needs a parent card to work properly
  let!(:master_getting_started) { create(:collection, name: 'Seeded Content', num_cards: 2, parent_collection: shape_administration) }
  let!(:master_org_templates) { create(:collection, name: '{Org} Templates', num_cards: 3, parent_collection: shape_administration) }
  let(:getting_started_collection) do
    organization.reload.getting_started_collection
  end

  let(:template_collection) do
    organization.create_template_collection(
      name: "#{organization.name} Templates",
      organization: organization,
    )
  end

  before do
    ENV['GETTING_STARTED_TEMPLATE_ID'] = master_getting_started.id.to_s
    ENV['ORG_MASTER_TEMPLATES_ID'] = master_org_templates.id.to_s

    allow(FilestackFile).to receive(:create_from_url).and_return(filestack_file)
    allow_any_instance_of(User)
      .to receive(:current_user_collection).and_return(user_collection)

    # simulating the setup that happened in OrganizationTemplates service
    organization.admin_group.add_role(Role::EDITOR, template_collection)
    organization.reload
    organization.update(template_collection: template_collection)

    allow_any_instance_of(User)
      .to receive(:current_user_collection).and_return(user_collection)

    # perform before every test
    OrganizationTemplatesWorker.new.perform(
      organization.id,
      user.id,
    )
    organization.reload
    template_collection.reload
  end

  describe '#perform' do
    context 'copying templates from master' do
      it 'should copy all the cards from the master collection into the template_collection' do
        # all the master template cards (3), profile, getting started
        expect(template_collection.collection_cards.count).to eq 5
      end
    end

    context 'with profile template' do
      it 'should create a profile template in the templates collection' do
        expect(organization.profile_template).not_to be nil
        expect(organization.profile_template.parent).to eq template_collection
      end

      it 'should create two collection cards' do
        expect(profile_template.collection_cards.count).to eq 2
      end

      it 'should add the admin group as editor of the items' do
        expect(
          profile_template.items.first.can_edit?(
            organization.admin_group,
          ),
        ).to be true
        expect(
          profile_template.items.last.can_edit?(
            organization.admin_group,
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

    context 'with getting started template' do
      let!(:getting_started_template) do
        create(:collection,
               organization: organization,
               num_cards: 3)
      end

      it 'duplicates template to organization' do
        expect(getting_started_collection).not_to eq(getting_started_template)
        expect(getting_started_collection.persisted?).to be true
        expect(getting_started_collection).to be_instance_of(Collection::Global)
        expect(getting_started_collection.system_required?).to be true
      end

      it 'assigns admin group as editor' do
        expect(getting_started_collection.editors[:groups]).to match_array(
          [organization.admin_group],
        )
        expect(getting_started_collection.editors[:users]).to be_empty
      end

      it 'has no viewers' do
        expect(getting_started_collection.viewers[:users]).to be_empty
        expect(getting_started_collection.viewers[:groups]).to be_empty
      end
    end

    context 'for first admin user' do
      it 'should create their getting started content' do
        expect(user.current_user_collection.children.map(&:cloned_from_id)).to eq(
          getting_started_collection.children.pluck(:id),
        )
      end
    end

    context 'with collections already created' do
      it 'should not create duplicate collections' do
        first_count = template_collection.children.count
        # calling worker a second time...
        OrganizationTemplatesWorker.new.perform(
          organization.id,
          user.id,
        )
        expect(template_collection.reload.children.count).to eq first_count
      end
    end
  end
end
