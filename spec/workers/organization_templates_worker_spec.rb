require 'rails_helper'

RSpec.describe OrganizationTemplatesWorker, type: :service do
  let(:user) { create(:user) }
  let(:organization) { create(:organization) }
  let(:user_collection) { create(:user_collection, organization: organization, add_editors: [user]) }

  describe '#perform' do
    context 'with getting started template' do
      let!(:getting_started_template) do
        create(:collection,
               organization: organization,
               num_cards: 3)
      end
      let(:template_collection) do
        organization.create_template_collection(
          name: "#{organization.name} Templates",
          organization: organization,
        )
      end

      before do
        organization.admin_group.add_role(Role::EDITOR, template_collection)
        organization.reload
        organization.update(template_collection: template_collection)
        allow_any_instance_of(User)
          .to receive(:current_user_collection).and_return(user_collection)
        OrganizationTemplatesWorker.new.perform(
          organization.id,
          getting_started_template.id,
          user.id,
        )
      end

      let(:getting_started_collection) do
        organization.reload.getting_started_collection
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
  end
end
