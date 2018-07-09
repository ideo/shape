require 'rails_helper'

RSpec.describe OrganizationTemplates, type: :service do
  let(:organization) { create(:organization) }
  let(:profile_template) { organization.profile_template }
  let(:filestack_file) { create(:filestack_file) }
  let(:service) { OrganizationTemplates.new(organization) }

  before do
    allow(FilestackFile).to receive(:create_from_url).and_return(filestack_file)
  end

  describe '#call' do
    let(:organization) { create(:organization) }
    let(:user) { create(:user) }
    let(:template_collection) { organization.template_collection }

    before do
      service.call
      profile_template.reload
    end

    it 'should save the attributes on the org' do
      organization.reload
      expect(organization.template_collection_id).to eq template_collection.id
    end

    context 'with template collection' do
      it 'should create a template collection for the org' do
        expect(organization.template_collection.persisted?).to be true
        expect(organization.template_collection.name).to eq("#{organization.name} Templates")
      end

      it 'should add the admin group as the content editor role' do
        expect(
          organization.admin_group.has_role?(
            Role::CONTENT_EDITOR,
            organization.template_collection,
          ),
        ).to be true
      end
    end

    context 'with profile template' do
      it 'should create a profile template in the templates collection' do
        expect(template_collection.children.count).to be 1
        expect(template_collection.collections.first.type).to eq 'Collection::MasterTemplate'
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

      it 'should create a image item and a text item' do
        expect(profile_template.items.count).to eq 2
        expect(profile_template.items.first.type).to eq 'Item::ImageItem'
        expect(profile_template.items.last.type).to eq 'Item::TextItem'
      end

      it 'should calculate the breadcrumb for the items' do
        item = profile_template.items.first
        expect(item.breadcrumb).to match_array(
          [
            ['Collection', template_collection.id, template_collection.name],
            ['Collection', profile_template.id, profile_template.name],
            ['Item', item.id, item.name],
          ],
        )
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
        expect {
          service.call
        }.to not_change(Collection, :count)
      end
    end
  end
end
