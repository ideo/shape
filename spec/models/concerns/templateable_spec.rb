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
    let(:other_collection) { create(:collection) }
    let!(:other_template) { create(:collection, parent_collection: other_collection, master_template: true, num_cards: 1) }
    let!(:link_card) { create(:collection_card_link_collection, collection: other_template, parent: template, order: 4) }
    let!(:link_card_2) { create(:collection_card_link_text, parent: template, order: 5) }
    let(:collection) { create(:collection) }

    before do
      template.setup_templated_collection(
        for_user: user,
        collection: collection,
        synchronous: true,
      )
    end

    it 'should copy the templated cards into the new collection' do
      expect(collection.collection_cards.primary.count).to eq 3
    end

    it 'should set itself as the collection\'s template' do
      expect(collection.template).to eq template
    end

    it 'should preserve links as links' do
      # the collection links should not get converted into actual collections
      expect(collection.collections).to be_empty
      # Doesn't copy link_card_2 because it has no parent_collection_card
      expect(collection.link_collection_cards.count).to eq(1)
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

    before do
      template.setup_templated_collection(
        for_user: nil,
        collection: template_instance,
        synchronous: true,
      )
    end

    it 'should update all instances with collection_to_test setting' do
      expect {
        template.update_test_template_instance_types!
        template_instance.reload
      }.to change(template_instance, :collection_to_test_id)
      # collection_to_test in instance should refer to its own parent
      expect(template_instance.collection_to_test_id).to eq instance_parent.id
    end

    it 'should call hide_or_show_section_questions! on each instance' do
      template.update_test_template_instance_types!
      template.hide_or_show_section_questions!
      template.reload
      template_instance.reload
      # template and instance should both have hidden 3 cards
      hidden_cards = template_instance.collection_cards.hidden
      hidden_template_cards = template.collection_cards.hidden
      expect(hidden_cards.count).to eq 3
      expect(hidden_cards.pluck(:templated_from_id)).to match_array(
        hidden_template_cards.pluck(:id),
      )
      expect(hidden_cards.pluck(:section_type)).to eq(
        %w[intro ideas outro],
      )
    end
  end
end
