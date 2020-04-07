require 'rails_helper'

describe TemplatesController, type: :request, auth: true do
  include ApplicationHelper
  let(:user) { @user }

  describe '#use_in_my_collection' do
    let(:collection) { create(:collection, master_template: true) }
    let(:path) { "/templates/#{collection.id}/use_in_my_collection" }

    context 'not logged in', auth: false do
      # this route specifically has logic to redirect to sign_up instead of login
      it 'should redirect to sign up' do
        expect(get(path)).to redirect_to(sign_up_url)
      end
    end

    context 'without view access' do
      it 'should redirect to root path' do
        expect(get(path)).to redirect_to(root_url)
      end
    end

    context 'with non-template' do
      let(:collection) { create(:collection, add_viewers: [user]) }

      it 'should redirect to root path' do
        expect(get(path)).to redirect_to(root_url)
      end
    end

    context 'without an organization' do
      let(:collection) { create(:collection, master_template: true, add_viewers: [user]) }

      it 'should redirect to root path' do
        # technically session variable should also be set which you can't inspect here
        # - this gets tested in organizations_controller_spec
        expect(get(path)).to redirect_to(root_url)
      end
    end

    context 'with an organization' do
      let(:organization) { create(:organization) }
      let(:builder_double) { double('CollectionTemplateBuilder') }
      let(:instance) { create(:collection) }

      before do
        # add user to org
        user.add_role(Role::MEMBER, organization.primary_group)
        organization.setup_user_membership_and_collections(user)

        allow(CollectionTemplateBuilder).to receive(:new).and_return(builder_double)
        allow(builder_double).to receive(:call).and_return(true)
        allow(builder_double).to receive(:collection).and_return(instance)
      end

      context 'with a common viewable template' do
        let(:collection) { create(:collection, master_template: true, common_viewable: true) }

        it 'should call CollectionTemplateBuilder' do
          expect(CollectionTemplateBuilder).to receive(:new).with(
            parent: user.current_user_collection,
            template: collection,
            placement: 'end',
            created_by: user,
          )
          expect(builder_double).to receive(:call)
          expect(get(path)).to redirect_to(frontend_url_for(instance))
        end
      end
    end
  end
end
