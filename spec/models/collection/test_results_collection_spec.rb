require 'rails_helper'

describe Collection::TestResultsCollection, type: :model do
  let(:user) { create(:user) }
  let!(:parent_collection) { create(:collection) }
  let!(:test_collection) { create(:test_collection, :completed, parent_collection: parent_collection) }
  let(:launch) do
    test_collection.reload
    test_collection.launch!(initiated_by: create(:user))
    test_collection.test_results_collection.reload
  end
  let(:test_results_collection) { test_collection.test_results_collection }

  context 'associations' do
    it { should belong_to :test_collection }
  end

  context 'callbacks' do
    describe '#initialize_cards!' do
      it 'should create a chart item for each scale question' do
        count = test_collection.question_items.select { |q| q.question_context? || q.question_useful? }.size
        expect {
          launch
        }.to change(
          Item::DataItem, :count
        ).by(count)
        expect(test_results_collection.items.where(type: 'Item::DataItem').size).to eq count
      end

      context 'with open response questions' do
        let!(:test_collection) { create(:test_collection, :open_response_questions, parent_collection: parent_collection) }

        it 'creates a TestOpenResponse collection for each item' do
          count = test_collection.question_items.size
          expect do
            launch
          end.to change(
            Collection::TestOpenResponses, :count
          ).by(count)
          expect(test_results_collection.collections.where(type: 'Collection::TestOpenResponses').size).to eq count

          expect(
            test_collection
              .question_items
              .all?(&:test_open_responses_collection),
          ).to be true
        end
      end

      context 'with media questions' do
        let!(:test_collection) { create(:test_collection) }

        it 'creates a media item link for each media item' do
          test_collection.launch!(initiated_by: user)
          expect(
            test_collection
              .items
              .count,
          ).to equal 4
        end
      end

      # context 'with media questions' do
      #   # "completed" will have one video item
      #   let!(:test_collection) { create(:test_collection, :completed) }
      #   let(:first_card) { test_collection.collection_cards.first }
      #
      #   it 'creates a media item link for the media item' do
      #     test_collection.launch!(initiated_by: user)
      #     expect(first_card.is_a?(CollectionCard::Link)).to be true
      #     expect(first_card.item).to eq test_collection.test_design.items.first
      #   end
      # end

      context 'with more scaled questions' do
        let!(:scale_questions) { create_list(:question_item, 2, parent_collection: test_collection) }
        let(:legend_item) { test_results_collection.legend_item }

        it 'should create a LegendItem at the 3rd spot (order == 2)' do
          launch
          expect(legend_item.parent_collection_card.order).to eq 2
          expect(
            test_results_collection
            .collection_cards
            .reload
            .map { |card| card.record.class.name },
          ).to eq(
            [
              'Item::VideoItem',
              'Item::DataItem',
              'Item::LegendItem',
              'Item::DataItem',
              'Item::DataItem',
              'Collection::TestCollection',
            ],
          )
        end
      end
    end
  end

  describe '#duplicate!' do
    let(:duplicate) do
      test_results_collection.duplicate!(
        for_user: user,
        copy_parent_card: false,
        parent: parent_collection,
      )
    end
    before do
      launch
      network_mailing_list_doubles
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

    it 'turns it back into a Collection::TestCollection' do
      expect(duplicate).to be_instance_of(Collection::TestCollection)
    end

    it 'has copies of the question items' do
      test_collection.reload
      expect(
        duplicate.question_items.pluck(:question_type),
      ).to match_array(
        test_collection.question_items.pluck(:question_type),
      )
      expect(
        duplicate.question_items.pluck(:cloned_from_id),
      ).to match_array(
        test_collection.question_items.pluck(:id),
      )
    end
  end
end
