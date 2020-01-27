require 'rails_helper'

describe Templateable, type: :concern do
  describe '#profile_template?' do
    let(:organization) { create(:organization) }
    let(:profile_template) { organization.profile_template }

    before do
      organization.create_profile_master_template(
        name: 'profile template',
      )
    end

    it 'should be a MasterTemplate' do
      expect(profile_template.master_template?).to be true
    end

    it 'should return true if it\'s the org\'s profile template' do
      expect(profile_template.profile_template?).to be true
    end
  end

  context 'callbacks' do
    describe '#add_template_tag' do
      let(:collection) { create(:collection, master_template: true) }

      it 'should give the #template tag if it is a master_template' do
        expect(collection.reload.cached_owned_tag_list).to match_array(['template'])
      end
    end
  end

  describe '#setup_templated_collection' do
    let(:organization) { create(:organization) }
    let(:user) { create(:user, current_organization: organization) }
    let(:template) { create(:collection, master_template: true, num_cards: 3, add_editors: [user]) }
    let(:collection) { create(:collection) }

    before do
      template.setup_templated_collection(
        for_user: user,
        collection: collection,
      )
    end

    it 'should copy the templated cards into the new collection' do
      expect(collection.collection_cards.count).to eq 3
    end

    it 'should set itself as the collection\'s template' do
      expect(collection.template).to eq template
    end
  end

  describe '#update_test_template_instance_types!' do
    let(:parent_collection) { create(:collection) }
    let!(:template) do
      create(:test_collection,
             master_template: true,
             parent_collection: parent_collection,
             collection_to_test_id: parent_collection.id)
    end
    let(:instance_parent) { create(:collection) }
    let!(:template_instance) do
      create(:test_collection, template: template, parent_collection: instance_parent)
    end

    it 'should update all instances with collection_to_test setting' do
      expect {
        template.update_test_template_instance_types!
        template_instance.reload
      }.to change(template_instance, :collection_to_test_id)
      # collection_to_test in instance should refer to its own parent
      expect(template_instance.collection_to_test_id).to eq instance_parent.id
    end
  end
end
