require 'rails_helper'

RSpec.describe CollectionTemplateBuilder, type: :service do
  let(:organization) { create(:organization) }
  let(:template) do
    create(
      :collection,
      organization: organization,
      master_template: true,
      num_cards: 2,
      pin_cards: true,
      collection_type: :project,
    )
  end
  let(:viewer) { create(:user) }
  let(:parent) { create(:collection, num_cards: 2, organization: organization, add_viewers: [viewer]) }
  let(:user) { create(:user) }
  let(:placement) { 'end' }
  let(:builder) do
    CollectionTemplateBuilder.new(
      parent: parent,
      template: template,
      placement: placement,
      created_by: user,
    )
  end
  let(:instance) { builder.call }

  describe '#call' do
    it 'should create a new collection that is linked to the template' do
      expect(instance.template).to eq template
      expect(instance.name).to eq "My #{template.name}"
    end

    it 'should copy the tags over to the instance' do
      expect(instance.tag_list).to eq template.tag_list
    end

    it 'copies the collection_type' do
      expect(instance.collection_type).to eq('project')
    end

    it 'should give parent collection users the same access to collection and its items' do
      expect(instance.can_view?(viewer)).to be true
      expect(instance.collection_cards.first.record.can_view?(viewer)).to be true
    end

    it 'should create a new collection instance that copies the pinned cards from the template' do
      expect(instance.collection_cards.count).to eq template.collection_cards.count
    end

    it 'should create a new collection instance that copies the pinned cards from the template' do
      expect(instance.collection_cards.count).to eq template.collection_cards.count
    end

    it 'should assign current user as created_by' do
      expect(instance.created_by).to eq user
    end

    it 'should place the collection instance in the parent collection' do
      instance # evaluate builder.call
      parent.reload
      expect(parent.primary_collection_cards.last.record).to eq instance
      expect(parent.primary_collection_cards.map(&:col)).to match_array [0, 1, 2]
      # breadcrumb should include parent collection and self
      expect(instance.breadcrumb).to match_array([parent.id])
      expect(instance.items.first.breadcrumb).to match_array([parent.id, instance.id])
    end

    it 'should tag the collection instance with the template name' do
      expect(instance.owned_tag_list).to include(template.name.parameterize)
    end

    context 'with row/col placement' do
      let(:parent) { create(:board_collection, organization: organization, add_viewers: [viewer]) }
      let(:placement) { { 'row' => 1, 'col' => 2 } }

      it 'should place the collection in the parent collection at the right row/col' do
        instance # evaluate builder.call
        parent.reload
        card = parent.collection_cards.first
        expect(card.record).to eq instance
        expect(card.row).to eq 1
        expect(card.col).to eq 2
      end
    end

    context 'with no row/col' do
      let(:parent) do
        create(
          :board_collection,
          organization: organization,
          add_viewers: [viewer],
          num_cards: 2,
        )
      end
      let(:placement) { nil }

      it 'should place the collection in the parent collection in next open spot' do
        instance
        parent.reload
        card = parent.collection_cards.last
        expect(card.record).to eq instance
        expect(card.row).to eq 0
        expect(card.col).to eq 2
      end
    end

    context 'with hardcoded cover settings on the template' do
      before do
        template.update(
          cached_cover: {
            hardcoded_subtitle: 'This is my subtitle.',
            subtitle_hidden: true,
          },
        )
      end

      it 'should copy the cover settings' do
        expect(instance.cached_cover['hardcoded_subtitle']).to eq 'This is my subtitle.'
        expect(instance.cached_cover['subtitle_hidden']).to be true
        expect(instance.cached_cover['card_ids'].first). to eq instance.collection_card_ids.first
      end
    end

    context 'when parent is a master_template' do
      let(:parent) { create(:collection, master_template: true) }

      it 'should not create an instance' do
        expect(builder.call).to be false
      end
    end

    context 'with a foamcore collection inside' do
      let!(:foamcore_child) { create(:board_collection, master_template: true, parent_collection: template) }
      let(:foamcore_instance) { instance.collections.first }

      it 'should create an instance of the foamcore master template' do
        expect(foamcore_instance.templated?).to be true
        expect(foamcore_instance.board_collection?).to be true
      end
    end

    context 'without a proper template' do
      let(:template) { create(:collection) }

      it 'should return false and give errors' do
        expect(instance).to be false
        expect(builder.errors.full_messages).to match_array [
          'Can only build a template instance from a master template',
        ]
      end
    end

    context 'with a submissions_collection parent' do
      let(:submission_box) { create(:submission_box, add_editors: [user], add_viewers: [viewer]) }
      let(:parent) { create(:submissions_collection, submission_box: submission_box) }
      let!(:comment_thread) { create(:collection_comment_thread, record: submission_box) }

      it 'should create a new collection that is marked as a "submission"' do
        expect(instance.template).to eq template
        expect(instance.submission?).to be true
      end

      it 'should be named "User\'s" instance' do
        expect(instance.name).to eq "#{user.first_name}'s #{template.name}"
      end

      it 'should give the creator editor access to collection and its items' do
        expect(instance.can_edit?(user)).to be true
        expect(instance.collection_cards.first.record.can_edit?(user)).to be true
      end

      it 'should create a new collection that is linked to the template' do
        expect(instance.name).to eq "#{user.first_name}'s #{template.name}"
      end

      it 'should assign permissions from the submission_box' do
        expect(instance.can_edit?(user)).to be true
        expect(instance.collection_cards.first.record.can_edit?(user)).to be true
        expect(instance.can_view?(viewer)).to be true
        expect(instance.collection_cards.first.record.can_view?(viewer)).to be true
      end

      it 'should subscribe the user to the comment thread' do
        expect(instance.can_edit?(user)).to be true
        users_thread = comment_thread.users_thread_for(user)
        expect(users_thread.subscribed).to be true
      end
    end

    context 'with a test template as a sub-collection' do
      let!(:test_collection) do
        create(:test_collection,
               master_template: true,
               collection_to_test: template)
      end
      let(:template_card) { test_collection.parent_collection_card }
      before do
        template.collection_cards << template_card
        template.reload
      end
      let(:test_instance_coll_card) do
        instance.collection_cards.where(
          templated_from: template_card.id,
        ).first
      end
      let(:test_instance) { test_instance_coll_card.collection }

      it 're-assigns collection_to_test to collection instance' do
        expect(test_collection.collection_to_test).to eq(template)
        # should be an instance of the test collection
        expect(test_instance.template).to eq test_collection
        expect(test_instance.master_template?).to be false
        expect(test_instance.is_a?(Collection::TestCollection)).to be true
        # test should point to the new instance parent
        expect(test_instance.collection_to_test).to eq(instance)
      end
    end

    context 'with collection filters' do
      let!(:collection_filter) { create(:collection_filter, collection: template) }

      it 'copies all filters' do
        expect do
          instance
        end.to change(CollectionFilter, :count).by(1)
        expect(instance.collection_filters.first.text).to eq(collection_filter.text)
      end
    end

    context 'with potential recursive loop' do
      let!(:collection) { create(:collection, master_template: true, num_cards: 2, pin_cards: true) }
      let!(:other_collection) { create(:collection) }
      let(:template_instance_updater) {
        TemplateInstanceUpdater.new(
          master_template: collection,
          updated_card_ids: collection.collection_cards.pluck(:id),
          template_update_action: :create,
        )
      }

      before do
        Sidekiq::Testing.inline!
        ENV['SKIP_NETWORK_ACTIONS'] = 'true'

        CollectionTemplateBuilder.call(
          parent: other_collection,
          template: collection,
        )
        c1 = CollectionTemplateBuilder.call(
          parent: other_collection,
          template: collection,
        )
        # cheat and move this one inside the parent anyway, to simulate bad issue
        c1.parent_collection_card.update(parent: collection, pinned: true)
        c1.recalculate_breadcrumb!
      end

      after do
        Sidekiq::Testing.fake!
        ENV['SKIP_NETWORK_ACTIONS'] = nil
      end

      it 'does not allow building the template inside itself' do
        attempt = CollectionTemplateBuilder.call(
          parent: collection,
          template: collection,
        )
        expect(attempt).to be false
      end

      it 'does not get stuck creating multiple instances of itself' do
        # NOTE: the fix is the result of a guard clause in templateable#add_cards_from_master_template
        collection.reload
        template_instance_updater.call
        templates_created = Collection.in_collection(other_collection).where(template: collection)
        expect(templates_created.count).to eq 1
        # should not end up creating more instances every time you call update_template_instances
        expect {
          collection.reload
          template_instance_updater.call
        }.not_to change(Collection, :count)
        expect(templates_created.reload.count).to eq 1
      end
    end
  end
end
