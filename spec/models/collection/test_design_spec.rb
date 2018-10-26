require 'rails_helper'

describe Collection::TestDesign, type: :model do
  context 'associations' do
    it { should belong_to :test_collection }
    it { should have_many :question_items }
  end

  describe '.duplicate!' do
    let(:user) { create(:user) }
    let!(:parent_collection) { create(:collection) }
    let!(:test_collection) { create(:test_collection, :completed) }
    before do
      user.add_role(Role::EDITOR, parent_collection)
      user.add_role(Role::EDITOR, test_collection)
      test_collection.children.each do |record|
        user.add_role(Role::EDITOR, record)
      end

      # Run background jobs to clone cards
      Sidekiq::Testing.inline!
    end

    after do
      Sidekiq::Testing.fake!
    end

    let!(:test_design) do
      test_collection.launch!(initiated_by: create(:user))
      # Need to call reload because test_collection relationship is stale
      test_collection.test_design.reload
    end
    let(:duplicate) do
      test_design.duplicate!(
        for_user: user,
        copy_parent_card: false,
        parent: parent_collection,
      )
    end

    it 'turns it back into a Collection::TestCollection' do
      expect(duplicate).to be_instance_of(Collection::TestCollection)
    end

    it 'has prelaunch question items' do
      expect(
        duplicate.prelaunch_question_items.pluck(:question_type),
      ).to match_array(
        test_collection.question_items.pluck(:question_type),
      )
    end
  end

  describe '#complete_question_cards' do
    let!(:test_collection) { create(:test_collection, :completed) }
    let!(:test_design) do
      test_collection.launch!(initiated_by: create(:user))
      # Need to call reload because test_collection relationship is stale
      test_collection.test_design.reload
    end
    let(:extra_question_cards) do
      create_list(:collection_card_question, 4, parent: test_design)
    end

    before do
      card = extra_question_cards.first
      # incomplete because it doesn't have content
      card.item.update(question_type: :question_open)
      card = extra_question_cards.second
      # incomplete because it doesn't have content
      card.item.update(question_type: :question_category_satisfaction)
      card = extra_question_cards.third
      # incomplete because it doesn't have a type
      card.item.update(question_type: nil)
      card = extra_question_cards.fourth
      # incomplete because it doesn't have media
      card.item.update(question_type: :question_media)
    end

    it 'should only get completed question cards' do
      # all the default cards + 4 incomplete
      expect(test_design.collection_cards.count).to eq 8
      # all the default cards only
      expect(test_design.complete_question_cards.count).to eq 4
    end
  end

  describe 'callbacks' do
    describe '#close_test' do
      let!(:test_collection) { create(:test_collection, :completed) }
      let!(:test_design) do
        test_collection.launch!(initiated_by: create(:user))
        # Need to call reload because test_collection relationship is stale
        test_collection.test_design.reload
      end

      it 'closes test collection if archived' do
        expect(test_collection.live?).to be true
        expect(test_design.reload.archived?).to be false
        test_design.archive!
        expect(test_design.reload.archived?).to be true
        expect(test_collection.reload.closed?).to be true
      end
    end
  end
end
